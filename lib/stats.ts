import { runCypher, isConfigured } from './neo4j';
import { inMemoryErrorClasses } from './matching';

export interface ErrataStats {
  totalErrorClasses: number;
  totalOccurrences: number;
  totalSelfSolved: number;
  selfSolveRate: number;
  recidivismRate: number;
  topRecurring: Array<{
    id: string;
    title: string;
    occurrences: number;
    selfSolved: number;
    lastSeen: string;
    tags: string[];
  }>;
  technologyBreakdown: Array<{ name: string; count: number }>;
  conceptBreakdown: Array<{ name: string; count: number }>;
}

export async function getStats(): Promise<ErrataStats> {
  if (isConfigured()) {
    try {

      const countsRes = await runCypher<any>(`
        MATCH (e:ErrorClass)
        OPTIONAL MATCH (o:Occurrence)
        RETURN
          count(DISTINCT e) AS total_classes,
          count(o) AS total_occs,
          sum(coalesce(e.self_solved_count, 0)) AS total_self_solved
      `);

      const totalClasses = countsRes[0]?.total_classes || 0;
      const totalOccs = countsRes[0]?.total_occs || 0;
      const totalSelfSolved = countsRes[0]?.total_self_solved || 0;


      const recidivismRes = await runCypher<any>(`
        MATCH (e:ErrorClass)
        WHERE e.occurrence_count > 1
        RETURN count(e) AS recurring_classes
      `);
      const recurringClasses = recidivismRes[0]?.recurring_classes || 0;


      const topRes = await runCypher<any>(`
        MATCH (e:ErrorClass)
        OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
        RETURN
          e.id AS id,
          e.title AS title,
          e.occurrence_count AS occurrences,
          e.self_solved_count AS selfSolved,
          e.last_seen AS lastSeen,
          collect(DISTINCT t.name) AS tags
        ORDER BY occurrences DESC
        LIMIT 10
      `);


      const techRes = await runCypher<any>(`
        MATCH (t:Technology)<-[:TAGGED]-(e:ErrorClass)
        RETURN t.name AS name, count(e) AS count
        ORDER BY count DESC
        LIMIT 10
      `);


      const conceptRes = await runCypher<any>(`
        MATCH (c:Concept)<-[:TEACHES]-(e:ErrorClass)
        RETURN c.name AS name, count(e) AS count
        ORDER BY count DESC
        LIMIT 10
      `);

      const selfSolveRate = totalOccs > 0 ? (totalSelfSolved / totalOccs) * 100 : 0;
      const recidivismRate = totalClasses > 0 ? (recurringClasses / totalClasses) * 100 : 0;

      return {
        totalErrorClasses: totalClasses,
        totalOccurrences: totalOccs,
        totalSelfSolved,
        selfSolveRate: Number(selfSolveRate.toFixed(1)),
        recidivismRate: Number(recidivismRate.toFixed(1)),
        topRecurring: topRes.map((r) => ({
          id: r.id,
          title: r.title,
          occurrences: r.occurrences || 1,
          selfSolved: r.selfSolved || 0,
          lastSeen: r.lastSeen || '',
          tags: r.tags || [],
        })),
        technologyBreakdown: techRes.map((t) => ({ name: t.name, count: t.count })),
        conceptBreakdown: conceptRes.map((c) => ({ name: c.name, count: c.count })),
      };
    } catch (err) {
      console.warn('Error fetching Neo4j stats:', err);
    }
  }


  const classes = Array.from(inMemoryErrorClasses.values());
  const totalClasses = classes.length;
  let totalOccs = 0;
  let totalSelfSolved = 0;
  let recurring = 0;

  for (const c of classes) {
    totalOccs += c.occurrence_count || 1;
    totalSelfSolved += c.self_solved_count || 0;
    if ((c.occurrence_count || 1) > 1) recurring++;
  }

  const sorted = [...classes].sort((a, b) => (b.occurrence_count || 1) - (a.occurrence_count || 1));

  return {
    totalErrorClasses: totalClasses,
    totalOccurrences: totalOccs,
    totalSelfSolved,
    selfSolveRate: totalOccs > 0 ? Number(((totalSelfSolved / totalOccs) * 100).toFixed(1)) : 0,
    recidivismRate: totalClasses > 0 ? Number(((recurring / totalClasses) * 100).toFixed(1)) : 0,
    topRecurring: sorted.slice(0, 10).map((c) => ({
      id: c.id,
      title: c.title,
      occurrences: c.occurrence_count || 1,
      selfSolved: c.self_solved_count || 0,
      lastSeen: c.last_seen || '',
      tags: c.tags || [],
    })),
    technologyBreakdown: [],
    conceptBreakdown: [],
  };
}
