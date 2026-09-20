import { NextRequest, NextResponse } from 'next/server';
import { runCypher, isConfigured } from '@/lib/neo4j';
import { inMemoryErrorClasses } from '@/lib/matching';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const rawLimit = Number(req.nextUrl.searchParams.get('limit') ?? '20');
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.floor(rawLimit))) : 20;

  if (!q) {
    return NextResponse.json({ results: [], query: '', count: 0 });
  }

  const queryLower = q.toLowerCase();

  try {
    if (isConfigured()) {

      const techWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

      const rows = await runCypher<any>(`
        MATCH (e:ErrorClass)
        OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
        OPTIONAL MATCH (e)-[:TEACHES]->(c:Concept)
        WITH e, collect(DISTINCT toLower(t.name)) AS techNames, collect(DISTINCT c.name) AS conceptNames
        WHERE
          toLower(e.title) CONTAINS toLower($q) OR
          toLower(coalesce(e.root_cause, '')) CONTAINS toLower($q) OR
          toLower(coalesce(e.past_fix_summary, '')) CONTAINS toLower($q) OR
          ANY(tech IN $techWords WHERE ANY(tn IN techNames WHERE tn CONTAINS tech))
        RETURN
          e.id AS id,
          e.title AS title,
          e.root_cause AS rootCause,
          e.past_fix_summary AS pastFix,
          e.occurrence_count AS occurrences,
          e.self_solved_count AS selfSolved,
          e.first_seen AS firstSeen,
          e.last_seen AS lastSeen,
          e.doc_path AS docPath,
          techNames AS tags,
          conceptNames AS concepts
        ORDER BY e.occurrence_count DESC
        LIMIT $limit
      `, { q, techWords, limit });

      return NextResponse.json({ results: rows, query: q, count: rows.length });
    }


    const classes = Array.from(inMemoryErrorClasses.values());
    const filtered = classes
      .filter((c) => {
        const blob = `${c.title} ${c.root_cause} ${c.past_fix_summary} ${(c.tags || []).join(' ')}`.toLowerCase();
        return blob.includes(queryLower);
      })
      .sort((a, b) => (b.occurrence_count || 1) - (a.occurrence_count || 1))
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        title: c.title,
        rootCause: c.root_cause,
        pastFix: c.past_fix_summary,
        occurrences: c.occurrence_count || 1,
        selfSolved: c.self_solved_count || 0,
        firstSeen: c.first_seen,
        lastSeen: c.last_seen,
        docPath: c.doc_path,
        tags: c.tags || [],
        concepts: c.concepts || [],
      }));

    return NextResponse.json({ results: filtered, query: q, count: filtered.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed.' }, { status: 500 });
  }
}
