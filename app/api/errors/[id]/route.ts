import { NextResponse } from 'next/server';
import { runCypher, isConfigured } from '@/lib/neo4j';
import { readVaultDoc } from '@/lib/vault';
import { inMemoryErrorClasses } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isConfigured()) {
    try {
      const cypher = `
        MATCH (e:ErrorClass { id: $id })
        OPTIONAL MATCH (e)-[:CAUSED_BY]->(rc:RootCause)
        OPTIONAL MATCH (e)-[:FIXED_BY]->(fix:Fix)
        OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
        OPTIONAL MATCH (e)-[:TEACHES]->(c:Concept)
        OPTIONAL MATCH (o:Occurrence)-[:INSTANCE_OF]->(e)
        RETURN
          e,
          rc.summary AS root_cause,
          fix.summary AS past_fix,
          collect(DISTINCT t.name) AS tags,
          collect(DISTINCT c.name) AS concepts,
          collect(DISTINCT {
            id: o.id,
            timestamp: o.timestamp,
            project: o.project,
            user_solved: o.user_solved_unaided,
            raw_message: o.raw_message
          }) AS occurrences
        LIMIT 1
      `;
      const records = await runCypher<any>(cypher, { id });
      if (records.length > 0) {
        const r = records[0];
        const e = r.e;
        let docContent: string | null = null;
        if (e.doc_path) {
          docContent = readVaultDoc(e.doc_path);
        }

        return NextResponse.json({
          error: {
            id: e.id,
            title: e.title,
            firstSeen: e.first_seen,
            lastSeen: e.last_seen,
            occurrences: e.occurrence_count || 1,
            selfSolved: e.self_solved_count || 0,
            rootCause: r.root_cause || e.root_cause,
            pastFix: r.past_fix || e.past_fix_summary,
            docPath: e.doc_path,
            docContent,
            tags: r.tags || [],
            concepts: r.concepts || [],
            occurrenceHistory: r.occurrences || [],
          },
        });
      }
    } catch (err) {
      console.warn('Error fetching single error class:', err);
    }
  }

  // Fallback in memory
  const mem = inMemoryErrorClasses.get(id);
  if (mem) {
    let docContent = mem.doc_path ? readVaultDoc(mem.doc_path) : null;
    return NextResponse.json({
      error: {
        id: mem.id,
        title: mem.title,
        firstSeen: mem.first_seen,
        lastSeen: mem.last_seen,
        occurrences: mem.occurrence_count || 1,
        selfSolved: mem.self_solved_count || 0,
        rootCause: mem.root_cause,
        pastFix: mem.past_fix_summary,
        docPath: mem.doc_path,
        docContent,
        tags: mem.tags || [],
        concepts: mem.concepts || [],
        occurrenceHistory: [],
      },
    });
  }

  return NextResponse.json({ error: null }, { status: 404 });
}
