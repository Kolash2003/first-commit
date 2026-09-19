import crypto from 'crypto';
import { runCypher, isConfigured } from './neo4j';
import { normalizeError } from './normalizer';
import { generateEmbedding } from './embeddings';
import { writeVaultDoc, VaultDocData } from './vault';
import { inMemoryErrorClasses } from './matching';

export interface LogResolutionInput {
  error_message: string;
  stack_trace?: string;
  root_cause: string;
  fix: string;
  explanation: string;
  diagrams?: Array<{ kind: string; mermaid: string }>;
  technology?: string[];
  files?: string[];
  project?: string;
  concepts?: string[];
  matched_error_class_id?: string;
  user_solved_unaided?: boolean;
}

export interface LogResolutionOutput {
  error_class_id: string;
  title: string;
  occurrence_count: number;
  doc_path: string;
  notice: string;
  suggested_review: boolean;
}

function generateShortId(prefix: string, seed: string): string {
  const hash = crypto.createHash('sha256').update(seed).digest('hex').substring(0, 8);
  return `${prefix}_${hash}`;
}

export async function logResolution(input: LogResolutionInput): Promise<LogResolutionOutput> {
  const norm = normalizeError(input.error_message, input.stack_trace);
  const now = new Date().toISOString();
  const techList = input.technology || [];
  const conceptList = input.concepts || [];
  const fileList = input.files || [];
  const project = input.project || 'default';
  const userSolved = Boolean(input.user_solved_unaided);

  const errorClassId = input.matched_error_class_id || generateShortId('ec', norm.fingerprint);
  const occurrenceId = generateShortId('occ', `${errorClassId}_${now}_${Math.random()}`);

  const embedding = await generateEmbedding(
    `${norm.normalizedMessage} ${input.root_cause} ${input.explanation}`
  );

  let occurrenceCount = 1;
  let selfSolvedCount = userSolved ? 1 : 0;
  let firstSeen = now;
  let title = norm.normalizedMessage.substring(0, 80);
  if (norm.errorType && !title.toLowerCase().startsWith(norm.errorType)) {
    title = `${norm.errorType.toUpperCase()}: ${title}`;
  }

  // Generate doc path in advance
  const datePrefix = now.split('T')[0];
  const docPath = `errors/${datePrefix}-${errorClassId}.md`;

  const occurrenceLog: VaultDocData['occurrenceLog'] = [
    {
      num: 1,
      date: now.split('T')[0],
      project,
      solvedBy: userSolved ? 'User' : 'AI',
    },
  ];

  if (isConfigured()) {
    try {
      // 1. Fetch existing ErrorClass if any to preserve first_seen and update occurrence count
      const existing = await runCypher<any>(
        `MATCH (e:ErrorClass { id: $id }) RETURN e LIMIT 1`,
        { id: errorClassId }
      );

      if (existing.length > 0) {
        const e = existing[0].e;
        occurrenceCount = (e.occurrence_count || 1) + 1;
        selfSolvedCount = (e.self_solved_count || 0) + (userSolved ? 1 : 0);
        firstSeen = e.first_seen || now;
        title = e.title || title;
      }

      // 2. Fetch past occurrences for doc log
      const pastOccs = await runCypher<any>(
        `MATCH (o:Occurrence)-[:INSTANCE_OF]->(e:ErrorClass { id: $id })
         RETURN o.timestamp AS timestamp, o.project AS project, o.user_solved_unaided AS user_solved
         ORDER BY o.timestamp DESC LIMIT 10`,
        { id: errorClassId }
      );

      let logNum = occurrenceCount;
      occurrenceLog.length = 0;
      occurrenceLog.push({
        num: logNum--,
        date: now.split('T')[0],
        project,
        solvedBy: userSolved ? 'User' : 'AI',
      });

      for (const occ of pastOccs) {
        occurrenceLog.push({
          num: logNum--,
          date: (occ.timestamp || '').split('T')[0] || 'past',
          project: occ.project || 'default',
          solvedBy: occ.user_solved ? 'User' : 'AI',
        });
      }

      // 3. Persist to Neo4j
      const cypher = `
        MERGE (e:ErrorClass { id: $id })
        ON CREATE SET
          e.fingerprint = $fingerprint,
          e.title = $title,
          e.first_seen = $now,
          e.last_seen = $now,
          e.occurrence_count = 1,
          e.self_solved_count = $self_solved_increment,
          e.embedding = $embedding,
          e.doc_path = $doc_path,
          e.root_cause = $root_cause,
          e.past_fix_summary = $past_fix
        ON MATCH SET
          e.last_seen = $now,
          e.occurrence_count = e.occurrence_count + 1,
          e.self_solved_count = e.self_solved_count + $self_solved_increment,
          e.embedding = $embedding,
          e.doc_path = $doc_path,
          e.root_cause = $root_cause,
          e.past_fix_summary = $past_fix

        CREATE (o:Occurrence {
          id: $occ_id,
          timestamp: $now,
          raw_message: $raw_message,
          stack_trace: $stack_trace,
          user_solved_unaided: $user_solved,
          project: $project
        })
        CREATE (o)-[:INSTANCE_OF]->(e)

        MERGE (rc:RootCause { id: 'rc_' + $id })
        SET rc.summary = $root_cause
        MERGE (e)-[:CAUSED_BY]->(rc)

        MERGE (fx:Fix { id: 'fix_' + $id })
        SET fx.summary = $past_fix
        MERGE (e)-[:FIXED_BY]->(fx)

        MERGE (p:Project { name: $project })
        MERGE (o)-[:OCCURRED_IN]->(p)

        WITH e, o
        UNWIND $technologies AS techName
        MERGE (t:Technology { name: techName })
        MERGE (e)-[:TAGGED]->(t)

        WITH e, o
        UNWIND $concepts AS conceptName
        MERGE (c:Concept { name: conceptName })
        MERGE (e)-[:TEACHES]->(c)

        WITH o
        UNWIND $files AS filePath
        MERGE (f:File { path: filePath })
        MERGE (o)-[:OCCURRED_IN]->(f)
      `;

      await runCypher(cypher, {
        id: errorClassId,
        occ_id: occurrenceId,
        fingerprint: norm.fingerprint,
        title,
        now,
        self_solved_increment: userSolved ? 1 : 0,
        user_solved: userSolved,
        embedding,
        doc_path: docPath,
        root_cause: input.root_cause,
        past_fix: input.fix,
        raw_message: input.error_message,
        stack_trace: input.stack_trace || '',
        project,
        technologies: techList.length > 0 ? techList : ['general'],
        concepts: conceptList.length > 0 ? conceptList : ['debugging'],
        files: fileList.length > 0 ? fileList : ['unknown'],
      });
    } catch (err) {
      console.error('Error executing Neo4j capture transaction:', err);
    }
  } else {
    // In-memory fallback
    const existing = inMemoryErrorClasses.get(errorClassId);
    if (existing) {
      occurrenceCount = existing.occurrence_count + 1;
      selfSolvedCount = existing.self_solved_count + (userSolved ? 1 : 0);
      firstSeen = existing.first_seen;
    }
    inMemoryErrorClasses.set(errorClassId, {
      id: errorClassId,
      fingerprint: norm.fingerprint,
      title,
      occurrence_count: occurrenceCount,
      self_solved_count: selfSolvedCount,
      first_seen: firstSeen,
      last_seen: now,
      root_cause: input.root_cause,
      past_fix_summary: input.fix,
      embedding,
      tags: techList,
      concepts: conceptList,
      doc_path: docPath,
    });
  }

  // Write or update the Markdown + Mermaid vault documentation
  try {
    await writeVaultDoc({
      id: errorClassId,
      title,
      firstSeen,
      lastSeen: now,
      occurrences: occurrenceCount,
      selfSolved: selfSolvedCount,
      tags: techList,
      concepts: conceptList,
      explanation: input.explanation,
      rootCause: input.root_cause,
      fix: input.fix,
      diagrams: input.diagrams,
      occurrenceLog,
    });
  } catch (err) {
    console.warn('Failed to write vault document:', err);
  }

  const ordinalSuffix = getOrdinal(occurrenceCount);
  const notice =
    occurrenceCount === 1
      ? `First occurrence captured — doc created at ${docPath}`
      : `${occurrenceCount}${ordinalSuffix} occurrence recorded — doc updated; knowledge consolidated.`;

  return {
    error_class_id: errorClassId,
    title,
    occurrence_count: occurrenceCount,
    doc_path: docPath,
    notice,
    suggested_review: occurrenceCount >= 3,
  };
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
