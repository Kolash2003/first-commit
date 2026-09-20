import { NextResponse } from 'next/server';
import { getStats } from '@/lib/stats';
import { runCypher, isConfigured } from '@/lib/neo4j';
import { inMemoryErrorClasses } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getStats();


    let dailyOccurrences: Array<{ date: string; count: number }> = [];

    let conceptScores: Array<{ concept: string; selfSolveRate: number; total: number }> = [];

    let weeklyTrend = { thisWeek: 0, lastWeek: 0, delta: 0 };

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    if (isConfigured()) {
      try {

        const dailyRows = await runCypher<any>(`
          MATCH (o:Occurrence)
          WHERE o.timestamp >= $cutoff
          RETURN substring(o.timestamp, 0, 10) AS date, count(o) AS count
          ORDER BY date ASC
        `, { cutoff: ninetyDaysAgo });
        dailyOccurrences = dailyRows.map((r) => ({ date: r.date, count: Number(r.count) }));


        const conceptRows = await runCypher<any>(`
          MATCH (c:Concept)<-[:TEACHES]-(e:ErrorClass)
          RETURN
            c.name AS concept,
            sum(e.occurrence_count) AS total,
            sum(e.self_solved_count) AS selfSolved
          ORDER BY total DESC
          LIMIT 8
        `);
        conceptScores = conceptRows.map((r) => ({
          concept: r.concept,
          selfSolveRate: r.total > 0 ? Math.round((r.selfSolved / r.total) * 100) : 0,
          total: Number(r.total),
        }));


        const weekRows = await runCypher<any>(`
          MATCH (o:Occurrence)
          RETURN
            count(CASE WHEN o.timestamp >= $oneWeek THEN 1 END) AS thisWeek,
            count(CASE WHEN o.timestamp >= $twoWeeks AND o.timestamp < $oneWeek THEN 1 END) AS lastWeek
        `, { oneWeek: oneWeekAgo, twoWeeks: twoWeeksAgo });
        const tw = weekRows[0]?.thisWeek ?? 0;
        const lw = weekRows[0]?.lastWeek ?? 0;
        weeklyTrend = { thisWeek: tw, lastWeek: lw, delta: lw > 0 ? Math.round(((tw - lw) / lw) * 100) : 0 };
      } catch {

      }
    } else {

      const classes = Array.from(inMemoryErrorClasses.values());
      const dateMap = new Map<string, number>();
      for (const c of classes) {
        const d = (c.last_seen || new Date().toISOString()).split('T')[0];
        dateMap.set(d, (dateMap.get(d) || 0) + (c.occurrence_count || 1));
      }
      dailyOccurrences = Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return NextResponse.json({ ...stats, dailyOccurrences, conceptScores, weeklyTrend });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to get stats' }, { status: 500 });
  }
}
