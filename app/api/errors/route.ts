import { NextResponse } from 'next/server';
import { runCypher, isConfigured } from '@/lib/neo4j';
import { inMemoryErrorClasses } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (isConfigured()) {
    try {
      const cypher = `
        MATCH (e:ErrorClass)
        WHERE $query = ''
           OR toLower(e.title) CONTAINS $query
           OR toLower(coalesce(e.root_cause, '')) CONTAINS $query
           OR toLower(coalesce(e.past_fix_summary, '')) CONTAINS $query
        OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
        OPTIONAL MATCH (e)-[:TEACHES]->(c:Concept)
        RETURN
          e.id AS id,
          e.title AS title,
          e.occurrence_count AS occurrences,
          e.self_solved_count AS self_solved,
          e.first_seen AS first_seen,
          e.last_seen AS last_seen,
          e.doc_path AS doc_path,
          e.root_cause AS root_cause,
          e.past_fix_summary AS past_fix,
          collect(DISTINCT t.name) AS tags,
          collect(DISTINCT c.name) AS concepts
        ORDER BY occurrences DESC
        LIMIT 100
      `;
      const records = await runCypher<any>(cypher, { query });
      const errors = records.map((r) => ({
        id: r.id,
        title: r.title,
        occurrences: r.occurrences || 1,
        selfSolved: r.self_solved || 0,
        firstSeen: r.first_seen,
        lastSeen: r.last_seen,
        docPath: r.doc_path,
        rootCause: r.root_cause,
        pastFix: r.past_fix,
        tags: r.tags || [],
        concepts: r.concepts || [],
      }));
      return NextResponse.json({ errors });
    } catch (err) {
      console.warn('Error fetching error list:', err);
    }
  }

  // Fallback in-memory
  const list = Array.from(inMemoryErrorClasses.values()).filter((e) => {
    if (!query) return true;
    return (
      (e.title && e.title.toLowerCase().includes(query)) ||
      (e.root_cause && e.root_cause.toLowerCase().includes(query))
    );
  });

  return NextResponse.json({
    errors: list.map((e) => ({
      id: e.id,
      title: e.title,
      occurrences: e.occurrence_count || 1,
      selfSolved: e.self_solved_count || 0,
      firstSeen: e.first_seen,
      lastSeen: e.last_seen,
      docPath: e.doc_path,
      rootCause: e.root_cause,
      pastFix: e.past_fix_summary,
      tags: e.tags || [],
      concepts: e.concepts || [],
    })),
  });
}
