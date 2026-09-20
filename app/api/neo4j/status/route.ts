import { NextResponse } from 'next/server';
import { verifyConnection, isConfigured, runCypher, parseNeo4jConfig } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isConfigured();
  const config = parseNeo4jConfig();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: 'Neo4j connection not configured. Set NEO4J_URI or NEO4J_URL in .env.local.',
      uri: config.uri,
      user: config.user,
    });
  }

  const verification = await verifyConnection();

  let nodeCounts = {
    errorClasses: 0,
    occurrences: 0,
    technologies: 0,
    concepts: 0,
  };

  if (verification.connected) {
    try {
      const res = await runCypher<any>(`
        OPTIONAL MATCH (e:ErrorClass)
        WITH count(e) AS errorClasses
        OPTIONAL MATCH (o:Occurrence)
        WITH errorClasses, count(o) AS occurrences
        OPTIONAL MATCH (t:Technology)
        WITH errorClasses, occurrences, count(t) AS technologies
        OPTIONAL MATCH (c:Concept)
        RETURN errorClasses, occurrences, technologies, count(c) AS concepts
      `);
      if (res.length > 0) {
        nodeCounts = {
          errorClasses: res[0].errorClasses || 0,
          occurrences: res[0].occurrences || 0,
          technologies: res[0].technologies || 0,
          concepts: res[0].concepts || 0,
        };
      }
    } catch {

    }
  }

  return NextResponse.json({
    configured: true,
    connected: verification.connected,
    version: verification.version,
    latencyMs: verification.latencyMs,
    database: verification.database,
    uri: verification.uri,
    error: verification.error,
    nodeCounts,
  });
}
