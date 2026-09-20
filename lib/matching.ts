import { runCypher, isConfigured } from './neo4j';
import { normalizeError } from './normalizer';
import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface CheckErrorInput {
  error_message: string;
  stack_trace?: string;
  context?: string;
  project?: string;
  technology?: string[];
}

export interface MatchResult {
  match: boolean;
  error_class_id?: string;
  title?: string;
  occurrence_count: number;
  first_seen?: string;
  last_seen?: string;
  root_cause?: string;
  past_fix_summary?: string;
  doc_path?: string;
  interrupt_prompt?: string;
  match_layer?: 'fingerprint' | 'semantic' | 'none';
  similarity_score?: number;
  similar_but_unmatched?: Array<{
    error_class_id: string;
    title: string;
    similarity: number;
  }>;
}


const inMemoryErrorClasses: Map<string, any> = new Map();

export async function matchError(input: CheckErrorInput): Promise<MatchResult> {
  const norm = normalizeError(input.error_message, input.stack_trace);
  const autoMergeThreshold = parseFloat(process.env.ERRATA_AUTO_MERGE_THRESHOLD || '0.6');
  const nearMissThreshold = parseFloat(process.env.ERRATA_NEAR_MISS_THRESHOLD || '0.45');


  if (isConfigured()) {
    try {
      const cypher = `
        MATCH (e:ErrorClass { fingerprint: $fingerprint })
        OPTIONAL MATCH (e)-[:CAUSED_BY]->(rc:RootCause)
        OPTIONAL MATCH (e)-[:FIXED_BY]->(fix:Fix)
        RETURN e, rc.summary AS root_cause, fix.summary AS past_fix
        LIMIT 1
      `;
      const records = await runCypher<any>(cypher, { fingerprint: norm.fingerprint });

      if (records.length > 0) {
        const row = records[0];
        const e = row.e;
        const count = e.occurrence_count || 1;
        const rootCause = row.root_cause || e.root_cause || 'Identified root cause';
        const pastFix = row.past_fix || e.past_fix_summary || 'Verified resolution steps';

        return {
          match: true,
          error_class_id: e.id,
          title: e.title || norm.normalizedMessage,
          occurrence_count: count,
          first_seen: e.first_seen,
          last_seen: e.last_seen,
          root_cause: rootCause,
          past_fix_summary: pastFix,
          doc_path: e.doc_path,
          match_layer: 'fingerprint',
          similarity_score: 1.0,
          interrupt_prompt: `You've hit this error ${count}× before. Root cause: ${rootCause}. Want to try fixing it yourself first? (Past fix: ${pastFix})`,
          similar_but_unmatched: [],
        };
      }
    } catch (err) {
      console.warn('Neo4j Layer 1 query error:', err);
    }
  } else {
    const memMatch = Array.from(inMemoryErrorClasses.values()).find(
      (item) => item.fingerprint === norm.fingerprint
    );
    if (memMatch) {
      return {
        match: true,
        error_class_id: memMatch.id,
        title: memMatch.title,
        occurrence_count: memMatch.occurrence_count,
        first_seen: memMatch.first_seen,
        last_seen: memMatch.last_seen,
        root_cause: memMatch.root_cause,
        past_fix_summary: memMatch.past_fix_summary,
        doc_path: memMatch.doc_path,
        match_layer: 'fingerprint',
        similarity_score: 1.0,
        interrupt_prompt: `You've hit this error ${memMatch.occurrence_count}× before. Root cause: ${memMatch.root_cause}. Want to try fixing it yourself first?`,
        similar_but_unmatched: [],
      };
    }
  }


  // DESIGN §7.2: embedded text = normalized error (+ root cause when known).
  // At check time there is no root cause yet, so embed the normalized message.
  const queryEmbedding = await generateEmbedding(norm.normalizedMessage);

  const inputTech = (input.technology || []).map((t) => t.toLowerCase());
  const nearMisses: Array<{ error_class_id: string; title: string; similarity: number }> = [];

  let candidates: Array<{
    id: string;
    title: string;
    fingerprint: string;
    embedding: number[];
    tags: string[];
    occurrence_count: number;
    first_seen: string;
    last_seen: string;
    doc_path: string;
    root_cause?: string;
    past_fix?: string;
  }> = [];

  if (isConfigured()) {
    try {
      const cypher = `
        MATCH (e:ErrorClass)
        OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
        OPTIONAL MATCH (e)-[:CAUSED_BY]->(rc:RootCause)
        OPTIONAL MATCH (e)-[:FIXED_BY]->(fix:Fix)
        RETURN e, collect(t.name) AS tags, rc.summary AS root_cause, fix.summary AS past_fix
      `;
      const records = await runCypher<any>(cypher);
      candidates = records.map((r) => ({
        id: r.e.id,
        title: r.e.title,
        fingerprint: r.e.fingerprint,
        embedding: r.e.embedding || [],
        tags: (r.tags || []).map((t: string) => t.toLowerCase()),
        occurrence_count: r.e.occurrence_count || 1,
        first_seen: r.e.first_seen,
        last_seen: r.e.last_seen,
        doc_path: r.e.doc_path,
        root_cause: r.root_cause,
        past_fix: r.past_fix,
      }));
    } catch (err) {
      console.warn('Neo4j Layer 2 candidate query error:', err);
    }
  } else {
    candidates = Array.from(inMemoryErrorClasses.values());
  }

  let bestMatch: (typeof candidates)[0] | null = null;
  let bestScore = 0;

  for (const cand of candidates) {
    if (!cand.embedding || cand.embedding.length === 0) continue;

    const sim = cosineSimilarity(queryEmbedding, cand.embedding);

    // DESIGN §7.2: match requires BOTH cosine ≥ threshold AND technology-tag
    // overlap. If the caller supplies tech tags, the candidate must share at
    // least one — an untagged candidate must NOT auto-merge (prevents graph
    // corruption, §12). Scores in [nearMiss, autoMerge) go to merge-review.
    const hasTechOverlap =
      inputTech.length === 0 || inputTech.some((t) => cand.tags.includes(t));

    if (sim >= autoMergeThreshold && hasTechOverlap) {
      if (sim > bestScore) {
        bestScore = sim;
        bestMatch = cand;
      }
    } else if (sim >= nearMissThreshold) {
      nearMisses.push({
        error_class_id: cand.id,
        title: cand.title,
        similarity: Number(sim.toFixed(2)),
      });
    }
  }

  if (bestMatch) {
    const count = bestMatch.occurrence_count;
    const rc = bestMatch.root_cause || 'Identified root cause';
    const fx = bestMatch.past_fix || 'Verified fix';

    return {
      match: true,
      error_class_id: bestMatch.id,
      title: bestMatch.title,
      occurrence_count: count,
      first_seen: bestMatch.first_seen,
      last_seen: bestMatch.last_seen,
      root_cause: rc,
      past_fix_summary: fx,
      doc_path: bestMatch.doc_path,
      match_layer: 'semantic',
      similarity_score: Number(bestScore.toFixed(2)),
      interrupt_prompt: `Similar to an error seen ${count}× before (${(bestScore * 100).toFixed(0)}% semantic match). Root cause: ${rc}. Want to try fixing it yourself first?`,
      similar_but_unmatched: nearMisses.sort((a, b) => b.similarity - a.similarity),
    };
  }

  return {
    match: false,
    occurrence_count: 0,
    similar_but_unmatched: nearMisses.sort((a, b) => b.similarity - a.similarity),
  };
}

export { inMemoryErrorClasses };
