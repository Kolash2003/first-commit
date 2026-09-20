import neo4j, { Driver, Session } from 'neo4j-driver';

// Cache driver across hot-reloads in development
declare global {
  var __neo4j_driver: Driver | undefined;
}

export interface Neo4jConfig {
  uri: string;
  user: string;
  password?: string;
  database?: string;
}

export function parseNeo4jConfig(): Neo4jConfig {
  const fullUrl = process.env.NEO4J_URL;
  if (fullUrl) {
    try {
      const parsed = new URL(fullUrl);
      const protocol = parsed.protocol.replace(':', '');
      const host = parsed.host;
      const user = decodeURIComponent(parsed.username || 'neo4j');
      const password = decodeURIComponent(parsed.password || '');
      const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined;
      return {
        uri: `${protocol}://${host}`,
        user,
        password,
        database: database || process.env.NEO4J_DATABASE || 'neo4j',
      };
    } catch {
      // Fall through if URL parsing fails
    }
  }

  return {
    uri: process.env.NEO4J_URI || 'neo4j+s://localhost:7687',
    user: process.env.NEO4J_USERNAME || process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || '',
    database: process.env.NEO4J_DATABASE || 'neo4j',
  };
}

export function isConfigured(): boolean {
  return Boolean(
    process.env.NEO4J_URL ||
    (process.env.NEO4J_URI && (process.env.NEO4J_USERNAME || process.env.NEO4J_USER))
  );
}

export function getNeo4jDriver(): Driver | null {
  if (!isConfigured()) {
    return null;
  }

  if (global.__neo4j_driver) {
    return global.__neo4j_driver;
  }

  const config = parseNeo4jConfig();
  const auth = config.password
    ? neo4j.auth.basic(config.user, config.password)
    : undefined;

  const driver = neo4j.driver(config.uri, auth, {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 10000,
  });

  global.__neo4j_driver = driver;
  return driver;
}

export async function verifyConnection(): Promise<{
  connected: boolean;
  version?: string;
  latencyMs?: number;
  database?: string;
  uri?: string;
  error?: string;
}> {
  if (!isConfigured()) {
    return {
      connected: false,
      error: 'Neo4j connection is not configured. Set NEO4J_URI or NEO4J_URL.',
    };
  }

  const config = parseNeo4jConfig();
  const startTime = Date.now();
  let driver: Driver | null = null;

  try {
    driver = getNeo4jDriver();
    if (!driver) {
      return { connected: false, error: 'Failed to initialize Neo4j driver.' };
    }

    const serverInfo = await driver.getServerInfo();
    const latencyMs = Date.now() - startTime;

    return {
      connected: true,
      version: serverInfo.agent || 'Neo4j 5.x',
      latencyMs,
      database: config.database || 'neo4j',
      uri: config.uri,
    };
  } catch (err: any) {
    return {
      connected: false,
      uri: config.uri,
      error: err?.message || String(err),
      latencyMs: Date.now() - startTime,
    };
  }
}

export async function runCypher<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const driver = getNeo4jDriver();
  if (!driver) {
    throw new Error(
      'Neo4j driver not initialized. Please configure NEO4J_URI and credentials in .env.local.'
    );
  }

  const config = parseNeo4jConfig();
  const session: Session = driver.session({
    database: config.database || 'neo4j',
    defaultAccessMode: neo4j.session.WRITE,
  });

  try {
    const result = await session.run(query, toNeo4jParams(params));
    return result.records.map((rec) => {
      const obj: Record<string, any> = {};
      rec.keys.forEach((key) => {
        const k = String(key);
        const val = rec.get(key);
        // Handle Neo4j Integers
        if (neo4j.isInt(val)) {
          obj[k] = val.toNumber();
        } else if (val && typeof val === 'object' && 'properties' in val) {
          obj[k] = sanitizeNeo4jProps(val.properties);
        } else {
          obj[k] = val;
        }
      });
      return obj as T;
    });
  } finally {
    await session.close();
  }
}

function toNeo4jParams(params: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'number' && Number.isInteger(val)) {
      out[key] = neo4j.int(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function sanitizeNeo4jProps(props: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(props)) {
    if (neo4j.isInt(val)) {
      sanitized[key] = val.toNumber();
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export async function initNeo4jSchema(): Promise<{ initialized: boolean; logs: string[] }> {
  const logs: string[] = [];
  const driver = getNeo4jDriver();
  if (!driver) {
    return { initialized: false, logs: ['Driver not configured.'] };
  }

  const statements = [
    'CREATE CONSTRAINT error_class_id_unique IF NOT EXISTS FOR (e:ErrorClass) REQUIRE e.id IS UNIQUE',
    'CREATE CONSTRAINT error_class_fingerprint_unique IF NOT EXISTS FOR (e:ErrorClass) REQUIRE e.fingerprint IS UNIQUE',
    'CREATE CONSTRAINT occurrence_id_unique IF NOT EXISTS FOR (o:Occurrence) REQUIRE o.id IS UNIQUE',
    'CREATE CONSTRAINT tech_name_unique IF NOT EXISTS FOR (t:Technology) REQUIRE t.name IS UNIQUE',
    'CREATE CONSTRAINT concept_name_unique IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE',
    'CREATE CONSTRAINT project_name_unique IF NOT EXISTS FOR (p:Project) REQUIRE p.name IS UNIQUE',
    'CREATE INDEX occurrence_timestamp IF NOT EXISTS FOR (o:Occurrence) ON (o.timestamp)',
  ];

  for (const stmt of statements) {
    try {
      await runCypher(stmt);
      logs.push(`Applied: ${stmt.substring(0, 50)}...`);
    } catch (err: any) {
      logs.push(`Warning on: ${stmt.substring(0, 40)}...: ${err.message}`);
    }
  }

  // Vector index creation (Neo4j 5.x+)
  const vectorIndexCypher = `
    CREATE VECTOR INDEX error_class_embeddings IF NOT EXISTS
    FOR (e:ErrorClass) ON (e.embedding)
    OPTIONS { indexConfig: {
      \`vector.dimensions\`: 384,
      \`vector.similarity_function\`: 'cosine'
    }}
  `;

  try {
    await runCypher(vectorIndexCypher);
    logs.push('Vector index error_class_embeddings created or confirmed.');
  } catch (err: any) {
    logs.push(`Vector index notice: ${err.message} (Will use fallback vector calculation if unavailable)`);
  }

  return { initialized: true, logs };
}
