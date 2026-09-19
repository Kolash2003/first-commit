import { NextResponse } from 'next/server';
import { runCypher, isConfigured } from '@/lib/neo4j';
import { inMemoryErrorClasses } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isConfigured()) {
    try {
      const cypher = `
        MATCH (o:Occurrence)-[:INSTANCE_OF]->(e:ErrorClass)
        OPTIONAL MATCH (e)-[:TAGGED]->(t:Technology)
        RETURN
          o.id AS id,
          o.timestamp AS timestamp,
          o.project AS project,
          o.user_solved_unaided AS user_solved,
          o.raw_message AS raw_message,
          e.id AS error_class_id,
          e.title AS error_class_title,
          e.occurrence_count AS occurrence_count,
          collect(DISTINCT t.name) AS tags
        ORDER BY o.timestamp DESC
        LIMIT 50
      `;
      const records = await runCypher<any>(cypher);
      const timeline = records.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        project: r.project || 'default',
        userSolved: Boolean(r.user_solved),
        rawMessage: r.raw_message,
        errorClassId: r.error_class_id,
        errorClassTitle: r.error_class_title,
        occurrenceCount: r.occurrence_count,
        tags: r.tags || [],
      }));
      return NextResponse.json({ timeline });
    } catch (err) {
      console.warn('Timeline query error:', err);
    }
  }

  // Fallback demo timeline
  const fallbackTimeline = [
    {
      id: 'occ_demo_1',
      timestamp: '2026-09-19T14:30:00Z',
      project: 'first-commit',
      userSolved: true,
      rawMessage: 'Error: listen EADDRINUSE: address already in use :::3000',
      errorClassId: 'ec_9f2a',
      errorClassTitle: 'EADDRINUSE: port 3000 already in use',
      occurrenceCount: 4,
      tags: ['node', 'express'],
    },
    {
      id: 'occ_demo_2',
      timestamp: '2026-09-18T16:20:00Z',
      project: 'dashboard-ui',
      userSolved: false,
      rawMessage: 'TypeError: Cannot read properties of undefined (reading "map")',
      errorClassId: 'ec_1b77',
      errorClassTitle: 'TypeError: undefined reading map',
      occurrenceCount: 3,
      tags: ['react', 'nextjs'],
    },
    {
      id: 'occ_demo_3',
      timestamp: '2026-09-15T11:05:00Z',
      project: 'auth-service',
      userSolved: true,
      rawMessage: 'JsonWebTokenError: jwt malformed',
      errorClassId: 'ec_3c89',
      errorClassTitle: 'JsonWebTokenError: jwt malformed header',
      occurrenceCount: 2,
      tags: ['jwt', 'security'],
    },
  ];

  return NextResponse.json({ timeline: fallbackTimeline });
}
