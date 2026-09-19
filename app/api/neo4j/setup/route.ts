import { NextResponse } from 'next/server';
import { initNeo4jSchema, isConfigured } from '@/lib/neo4j';

export async function POST() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'Neo4j connection not configured. Please supply connection string in .env.local.' },
      { status: 400 }
    );
  }

  try {
    const result = await initNeo4jSchema();
    return NextResponse.json({
      success: true,
      message: 'Neo4j constraints and indexes initialized successfully.',
      logs: result.logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to initialize Neo4j schema.' },
      { status: 500 }
    );
  }
}
