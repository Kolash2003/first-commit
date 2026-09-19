import { NextRequest, NextResponse } from 'next/server';
import { runCypher, isConfigured } from '@/lib/neo4j';
import { inMemoryErrorClasses } from '@/lib/matching';

export const dynamic = 'force-dynamic';

/** SM-2 scheduling algorithm */
function applySpacedRepetition(
  currentEaseFactor: number,
  currentInterval: number,
  rating: 'again' | 'hard' | 'good' | 'easy'
): { newInterval: number; newEaseFactor: number } {
  let ef = currentEaseFactor ?? 2.5;
  let interval = currentInterval ?? 1;

  switch (rating) {
    case 'again':
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
      break;
    case 'hard':
      interval = Math.ceil(interval * 1.2);
      ef = Math.max(1.3, ef - 0.15);
      break;
    case 'good':
      interval = Math.ceil(interval * ef);
      // ef unchanged
      break;
    case 'easy':
      interval = Math.ceil(interval * ef * 1.3);
      ef = Math.min(2.5, ef + 0.1);
      break;
  }

  return { newInterval: Math.max(1, interval), newEaseFactor: Number(ef.toFixed(2)) };
}

/**
 * GET /api/review
 * Returns error classes due for flashcard review, ordered by highest recurrence first.
 * An error is due if:
 *   - It has never been reviewed (no review_due_date), OR
 *   - Its review_due_date is today or in the past
 */
export async function GET(req: NextRequest) {
  const today = new Date().toISOString().split('T')[0];
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '10');

  try {
    if (isConfigured()) {
      const rows = await runCypher<any>(`
        MATCH (e:ErrorClass)
        WHERE e.review_due_date IS NULL OR e.review_due_date <= $today
        OPTIONAL MATCH (e)-[:CAUSED_BY]->(rc:RootCause)
        OPTIONAL MATCH (e)-[:FIXED_BY]->(fx:Fix)
        OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
        OPTIONAL MATCH (e)-[:TEACHES]->(c:Concept)
        RETURN
          e.id AS id,
          e.title AS title,
          e.root_cause AS rootCause,
          e.past_fix_summary AS pastFix,
          e.occurrence_count AS occurrences,
          e.self_solved_count AS selfSolved,
          e.ease_factor AS easeFactor,
          e.review_due_date AS reviewDueDate,
          e.current_interval AS currentInterval,
          collect(DISTINCT t.name) AS tags,
          collect(DISTINCT c.name) AS concepts
        ORDER BY e.occurrence_count DESC
        LIMIT $limit
      `, { today, limit });

      return NextResponse.json({ cards: rows, total: rows.length });
    }

    // In-memory fallback
    const classes = Array.from(inMemoryErrorClasses.values())
      .sort((a, b) => (b.occurrence_count || 1) - (a.occurrence_count || 1))
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        title: c.title,
        rootCause: c.root_cause,
        pastFix: c.past_fix_summary,
        occurrences: c.occurrence_count,
        selfSolved: c.self_solved_count,
        easeFactor: 2.5,
        reviewDueDate: null,
        currentInterval: 1,
        tags: c.tags || [],
        concepts: c.concepts || [],
      }));

    return NextResponse.json({ cards: classes, total: classes.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to get review queue.' }, { status: 500 });
  }
}

/**
 * POST /api/review
 * Body: { error_class_id: string, rating: 'again'|'hard'|'good'|'easy' }
 * Applies SM-2 and stores next review_due_date + ease_factor in Neo4j.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { error_class_id, rating } = body;

    if (!error_class_id || !['again', 'hard', 'good', 'easy'].includes(rating)) {
      return NextResponse.json({ error: 'error_class_id and rating (again/hard/good/easy) required.' }, { status: 400 });
    }

    if (isConfigured()) {
      // Fetch current SM-2 state
      const existing = await runCypher<any>(
        `MATCH (e:ErrorClass { id: $id }) RETURN e.ease_factor AS ef, e.current_interval AS interval LIMIT 1`,
        { id: error_class_id }
      );

      const currentEF = existing[0]?.ef ?? 2.5;
      const currentInterval = existing[0]?.interval ?? 1;

      const { newInterval, newEaseFactor } = applySpacedRepetition(currentEF, currentInterval, rating);

      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + newInterval);
      const nextDueStr = nextDue.toISOString().split('T')[0];

      await runCypher(
        `MATCH (e:ErrorClass { id: $id })
         SET e.ease_factor = $ef,
             e.current_interval = $interval,
             e.review_due_date = $due,
             e.last_reviewed = $today`,
        {
          id: error_class_id,
          ef: newEaseFactor,
          interval: newInterval,
          due: nextDueStr,
          today: new Date().toISOString().split('T')[0],
        }
      );

      return NextResponse.json({ ok: true, nextDue: nextDueStr, interval: newInterval, easeFactor: newEaseFactor });
    }

    // In-memory: just acknowledge
    return NextResponse.json({ ok: true, nextDue: null, interval: 1, easeFactor: 2.5 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to submit review.' }, { status: 500 });
  }
}
