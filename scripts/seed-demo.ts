import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { initNeo4jSchema, isConfigured } from '../lib/neo4j';
import { logResolution } from '../lib/capture';

async function seed() {
  console.log('Seeding Errata Demo Data...');
  if (isConfigured()) {
    console.log('Connected to Neo4j. Initializing schema constraints...');
    await initNeo4jSchema();
  } else {
    console.log('Neo4j not configured; seeding in-memory store.');
  }

  const sample1 = await logResolution({
    error_message: 'Error: listen EADDRINUSE: address already in use :::3000',
    stack_trace: 'at Server.setupListenHandle [as _listen2] (node:net:1904:16)\n at listenInCluster (node:net:1961:12)\n at doListen (src/server.ts:42:10)',
    root_cause: 'Another process is already bound to port 3000 (often a previous node dev instance running in the background).',
    fix: 'Identify PID with "lsof -i :3000" and kill it via "kill -9 <PID>", or set PORT=3001 in .env.',
    explanation: 'TCP ports on an IP address can only be bound exclusively by a single listener socket at any given time. When node restarts without unbinding or another instance runs, EADDRINUSE is thrown.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[Start Next.js / Node Server] --> B[Request bind to :::3000]
    B --> C{Port 3000 Free?}
    C -->|Yes| D[Listening on http://localhost:3000]
    C -->|No - Zombie Process| E[EADDRINUSE Exception Triggered]`,
      },
      {
        kind: 'fix_sequence',
        mermaid: `sequenceDiagram
    participant Dev as Developer
    participant Shell as Terminal
    participant OS as Kernel
    Dev->>Shell: lsof -ti :3000
    Shell->>OS: Query socket owner
    OS-->>Shell: PID 8421
    Dev->>Shell: kill -9 8421
    Shell->>OS: Terminate process
    Dev->>Shell: npm run dev
    Shell-->>Dev: Server ready on :3000`,
      },
    ],
    technology: ['node', 'express', 'nextjs'],
    files: ['src/server.ts', 'package.json'],
    project: 'first-commit',
    concepts: ['ports', 'process-management', 'networking'],
    user_solved_unaided: false,
  });
  console.log('Seeded 1:', sample1.title);

  // Log occurrence 2 for sample 1 to demonstrate recurrence
  const sample1_recurrence = await logResolution({
    error_message: 'Error: listen EADDRINUSE: address already in use :::3000',
    stack_trace: 'at Server.setupListenHandle (node:net:1904:16)\n at doListen (src/server.ts:42:10)',
    root_cause: 'Port 3000 occupied by zombie process.',
    fix: 'Killed zombie process with killall node.',
    explanation: 'Recurrence of port collision.',
    technology: ['node', 'nextjs'],
    files: ['src/server.ts'],
    project: 'first-commit',
    concepts: ['ports', 'process-management'],
    matched_error_class_id: sample1.error_class_id,
    user_solved_unaided: true,
  });
  console.log('Seeded recurrence for 1:', sample1_recurrence.notice);

  const sample2 = await logResolution({
    error_message: 'TypeError: Cannot read properties of undefined (reading "map")',
    stack_trace: 'at UserList (src/components/UserList.tsx:14:22)\n at renderWithHooks (node_modules/react-dom:1289)',
    root_cause: 'State variable users initialized to undefined before async API query completed.',
    fix: 'Initialize state with default empty array: useState([]) and use optional chaining: users?.map(...)',
    explanation: 'In React components with asynchronous data fetching, initial render occurs before the network promise fulfills. Accessing array methods on an uninitialized variable throws a TypeError.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[Component Mounts] --> B[Initial Render: data is undefined]
    B --> C[data.map called]
    C --> D[TypeError: undefined reading map]`,
      },
    ],
    technology: ['react', 'nextjs', 'typescript'],
    files: ['src/components/UserList.tsx'],
    project: 'dashboard-ui',
    concepts: ['async-rendering', 'optional-chaining', 'react-state'],
    user_solved_unaided: true,
  });
  console.log('Seeded 2:', sample2.title);

  const sample3 = await logResolution({
    error_message: 'PostgresError: remaining connection slots are reserved for non-replication superuser connections',
    stack_trace: 'at Connection.parseE (node_modules/pg/lib/connection.js:614:13)\n at Client.connect (src/db/pool.ts:28:9)',
    root_cause: 'Database connection pool exhausted due to unreleased connections or excessive serverless lambda concurrency.',
    fix: 'Configure pgBouncer connection pooling, decrease max pool size per lambda, and ensure client.release() in finally block.',
    explanation: 'PostgreSQL max_connections limit was breached. Without centralized connection pooling, parallel serverless invocations open too many direct database sockets.',
    technology: ['postgresql', 'node', 'database'],
    files: ['src/db/pool.ts'],
    project: 'api-service',
    concepts: ['connection-pooling', 'database-concurrency', 'resource-leaks'],
    user_solved_unaided: false,
  });
  console.log('Seeded 3:', sample3.title);

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
