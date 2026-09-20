import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { initNeo4jSchema, isConfigured } from '../lib/neo4j';
import { logResolution } from '../lib/capture';

const ERRORS = [

  {
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
    occurrences: 4,
  },


  {
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
    B --> C[data.map called synchronously]
    C --> D[TypeError: Cannot read map of undefined]
    E[Fix] --> F[useState with empty array default]
    F --> G[Optional chaining: data?.map]`,
      },
    ],
    technology: ['react', 'nextjs', 'typescript'],
    files: ['src/components/UserList.tsx'],
    project: 'dashboard-ui',
    concepts: ['async-rendering', 'optional-chaining', 'react-state'],
    user_solved_unaided: true,
    occurrences: 3,
  },


  {
    error_message: 'PostgresError: remaining connection slots are reserved for non-replication superuser connections',
    stack_trace: 'at Connection.parseE (node_modules/pg/lib/connection.js:614:13)\n at Client.connect (src/db/pool.ts:28:9)',
    root_cause: 'Database connection pool exhausted due to unreleased connections or excessive serverless lambda concurrency.',
    fix: 'Configure pgBouncer connection pooling, decrease max pool size per lambda, and ensure client.release() in finally block.',
    explanation: 'PostgreSQL max_connections limit was breached. Without centralized connection pooling, parallel serverless invocations open too many direct database sockets.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[50 Lambda Invocations] --> B[Each opens PG connection]
    B --> C{max_connections = 100?}
    C -->|Exceeded| D[PostgresError: no slots available]
    E[Fix: PgBouncer] --> F[Single pool shared across all lambdas]`,
      },
    ],
    technology: ['postgresql', 'node', 'database'],
    files: ['src/db/pool.ts'],
    project: 'api-service',
    concepts: ['connection-pooling', 'database-concurrency', 'resource-leaks'],
    user_solved_unaided: false,
    occurrences: 2,
  },


  {
    error_message: "Access to fetch at 'https://api.myapp.io/users' from origin 'http://localhost:3000' has been blocked by CORS policy",
    stack_trace: 'at XMLHttpRequest.onreadystatechange (src/api/client.ts:34:14)',
    root_cause: 'The API server does not include Access-Control-Allow-Origin header for the frontend origin.',
    fix: 'Add cors() middleware to the Express server: app.use(cors({ origin: process.env.FRONTEND_URL }))',
    explanation: 'Browsers enforce the Same-Origin Policy. Cross-origin requests require the server to opt-in via CORS headers. The browser blocks the request before it reaches your code.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[Browser: fetch to api.myapp.io] --> B[Preflight OPTIONS request]
    B --> C{Server returns Access-Control-Allow-Origin?}
    C -->|No| D[Browser blocks response: CORS error]
    C -->|Yes| E[Request succeeds]`,
      },
    ],
    technology: ['express', 'react', 'node'],
    files: ['src/server.ts', 'src/api/client.ts'],
    project: 'dashboard-ui',
    concepts: ['cors', 'networking', 'authentication'],
    user_solved_unaided: false,
    occurrences: 3,
  },


  {
    error_message: 'JsonWebTokenError: jwt malformed',
    stack_trace: 'at /node_modules/jsonwebtoken/verify.js:63:21\n at middleware/auth.ts:18:12',
    root_cause: 'Token was decoded with base64 instead of being passed raw, adding extra characters.',
    fix: 'Ensure the Authorization header value is split correctly: "Bearer <token>".split(" ")[1] before passing to jwt.verify().',
    explanation: 'JWTs are three base64url-encoded segments separated by dots. Any corruption of the header, payload, or signature causes malformed errors. Double-encoding is a common trap.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[Client sends Authorization header] --> B["Bearer eyJhbGci..."]
    B --> C[Middleware splits on space]
    C --> D{Correct slice?}
    D -->|No: entire header passed| E[jwt.verify fails: malformed]
    D -->|Yes: token only| F[Verified successfully]`,
      },
    ],
    technology: ['node', 'express', 'typescript'],
    files: ['middleware/auth.ts'],
    project: 'api-service',
    concepts: ['authentication', 'debugging'],
    user_solved_unaided: true,
    occurrences: 2,
  },


  {
    error_message: 'RangeError: Maximum call stack size exceeded',
    stack_trace: 'at flatten (src/utils/tree.ts:12:18)\n at flatten (src/utils/tree.ts:14:22)\n at flatten (src/utils/tree.ts:14:22)',
    root_cause: 'Recursive flatten function has no base case for empty arrays — infinite recursion on deeply nested structures.',
    fix: 'Add base case: if (!Array.isArray(arr) || arr.length === 0) return []. Use iterative approach with a stack for very deep trees.',
    explanation: 'Every function call adds a frame to the JavaScript call stack. Without a base case, recursion continues until V8 exhausts the stack (typically ~10,000 frames) and throws RangeError.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[flatten called] --> B[Recurse on sub-array]
    B --> C[Recurse on sub-array]
    C --> D[... 10,000 frames ...]
    D --> E[RangeError: Maximum call stack]
    F[Fix: Base case] --> G{Array empty?}
    G -->|Yes| H[Return immediately]
    G -->|No| I[Recurse safely]`,
      },
    ],
    technology: ['javascript', 'typescript', 'node'],
    files: ['src/utils/tree.ts'],
    project: 'data-pipeline',
    concepts: ['recursion', 'call-stack', 'debugging'],
    user_solved_unaided: false,
    occurrences: 2,
  },


  {
    error_message: 'Error: connect ETIMEDOUT 10.0.1.45:5432',
    stack_trace: 'at TCPConnectWrap.afterConnect (node:net:1300:16)\n at src/services/db.ts:55:10',
    root_cause: 'The database service is in a different VPC subnet with no routing rules between services in staging environment.',
    fix: 'Add VPC peering rule or security group ingress rule allowing TCP:5432 from the application subnet CIDR.',
    explanation: 'ETIMEDOUT means the SYN packet was sent but no SYN-ACK was received within the timeout window. Unlike ECONNREFUSED (port is closed), ETIMEDOUT means the packet was dropped — usually a firewall or network routing issue.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[App Server: 10.0.0.x] -->|TCP SYN to 10.0.1.45:5432| B[Network]
    B --> C{Security Group Rule?}
    C -->|Blocked| D[Packet dropped silently]
    D --> E[30s timeout expires]
    E --> F[ETIMEDOUT]
    C -->|Allowed| G[TCP SYN-ACK received]`,
      },
    ],
    technology: ['node', 'postgresql', 'database'],
    files: ['src/services/db.ts'],
    project: 'api-service',
    concepts: ['networking', 'connection-pooling'],
    user_solved_unaided: false,
    occurrences: 2,
  },


  {
    error_message: 'ReferenceError: fetch is not defined',
    stack_trace: 'at callAPI (src/services/weather.ts:8:18)\n at Object.<anonymous> (src/index.ts:22:1)',
    root_cause: 'Node.js version is below 18 where fetch is not available globally. The native Fetch API was only added in Node 18.',
    fix: 'Either upgrade to Node 18+, or install node-fetch: npm install node-fetch and import it explicitly.',
    explanation: 'The browser fetch API was not available in Node.js until v18.0.0 (released April 2022). Code running on Node 16 or earlier must use an explicit HTTP library like node-fetch, axios, or got.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[Node.js < 18] --> B[No global fetch]
    B --> C[Code calls fetch]
    C --> D[ReferenceError: fetch not defined]
    E[Fix Option 1] --> F[Upgrade to Node 18+]
    G[Fix Option 2] --> H[import fetch from node-fetch]`,
      },
    ],
    technology: ['node', 'typescript'],
    files: ['src/services/weather.ts'],
    project: 'data-pipeline',
    concepts: ['debugging', 'networking'],
    user_solved_unaided: true,
    occurrences: 2,
  },


  {
    error_message: 'Error: Hydration failed because the initial UI does not match what was rendered on the server.',
    stack_trace: 'at throwOnHydrationMismatch (react-dom.development.js:12507:9)\n at app/layout.tsx:23:5',
    root_cause: 'A Date.now() or Math.random() call in a component produces different values on server vs client, causing HTML mismatch.',
    fix: 'Move dynamic values into useEffect or use suppressHydrationWarning on the element. Use a stable seed for random content.',
    explanation: 'Next.js renders pages on the server first and sends HTML to the browser. React then "hydrates" — attaching event handlers and reconciling the server HTML with what React would render client-side. Any mismatch causes the error.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[Server: render with timestamp T1] --> B[HTML sent to browser]
    B --> C[Client: re-render with timestamp T2]
    C --> D{T1 === T2?}
    D -->|No| E[Hydration mismatch error]
    D -->|Yes| F[React hydrates successfully]`,
      },
    ],
    technology: ['nextjs', 'react', 'typescript'],
    files: ['app/layout.tsx', 'app/page.tsx'],
    project: 'dashboard-ui',
    concepts: ['ssr', 'react-state', 'debugging'],
    user_solved_unaided: false,
    occurrences: 3,
  },


  {
    error_message: 'npm ERR! code EACCES\nnpm ERR! syscall mkdir\nnpm ERR! path /usr/local/lib/node_modules',
    stack_trace: 'npm ERR! Error: EACCES: permission denied, mkdir /usr/local/lib/node_modules',
    root_cause: 'npm is trying to install packages globally into a system directory owned by root, but the user lacks write permissions.',
    fix: 'Use nvm to manage Node.js and npm globally, or configure npm prefix to a user-writable directory: npm config set prefix ~/.npm-global',
    explanation: 'When Node.js is installed system-wide (e.g., /usr/local), the node_modules directory is owned by root. npm global installs require root permissions. The correct fix is a user-owned npm prefix, not sudo.',
    diagrams: [
      {
        kind: 'fix_sequence',
        mermaid: `sequenceDiagram
    participant Dev as Developer
    participant NPM as npm CLI
    participant FS as Filesystem
    Dev->>NPM: npm install -g some-tool
    NPM->>FS: mkdir /usr/local/lib/node_modules/some-tool
    FS-->>NPM: EACCES: permission denied (owned by root)
    NPM-->>Dev: npm ERR! EACCES
    Dev->>NPM: npm config set prefix ~/.npm-global
    Dev->>NPM: npm install -g some-tool
    NPM->>FS: mkdir ~/.npm-global/lib/node_modules/some-tool
    FS-->>NPM: OK
    NPM-->>Dev: + some-tool@1.0.0`,
      },
    ],
    technology: ['node', 'npm'],
    files: [],
    project: 'devops-setup',
    concepts: ['process-management', 'debugging'],
    user_solved_unaided: true,
    occurrences: 2,
  },


  {
    error_message: "ModuleNotFoundError: No module named 'pandas'",
    stack_trace: 'File "scripts/analyze.py", line 2, in <module>\n    import pandas as pd',
    root_cause: 'Script is running under the system Python interpreter instead of the activated virtual environment where pandas is installed.',
    fix: 'Activate the virtual environment first: source venv/bin/activate && python scripts/analyze.py, or use python -m venv to create one.',
    explanation: 'Virtual environments create isolated Python interpreters with their own site-packages. Running python outside an activated venv uses the system interpreter, which does not have project dependencies installed.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[python scripts/analyze.py] --> B{Which Python?}
    B -->|System: /usr/bin/python| C[site-packages: no pandas]
    B -->|venv: ./venv/bin/python| D[site-packages: pandas 2.0]
    C --> E[ModuleNotFoundError]
    D --> F[import succeeds]`,
      },
    ],
    technology: ['python'],
    files: ['scripts/analyze.py', 'requirements.txt'],
    project: 'data-pipeline',
    concepts: ['python-venv', 'debugging'],
    user_solved_unaided: true,
    occurrences: 2,
  },


  {
    error_message: 'CONFLICT (content): Merge conflict in src/api/routes.ts\nAutomatic merge failed; fix conflicts and then commit the result.',
    stack_trace: '',
    root_cause: 'Two branches modified the same lines in routes.ts — one added a /health endpoint, the other refactored the router export.',
    fix: 'Open routes.ts, resolve the conflict markers (<<<, ===, >>>), keep both changes, then: git add src/api/routes.ts && git commit',
    explanation: 'Git merges files line-by-line. When two branches change the same region of a file, git cannot automatically decide which version to keep and inserts conflict markers for the developer to resolve manually.',
    diagrams: [
      {
        kind: 'root_cause_flow',
        mermaid: `flowchart TD
    A[main branch: added /health route] --> C[Diverge from common ancestor]
    B[feature branch: refactored router export] --> C
    C --> D[git merge feature]
    D --> E{Same lines changed?}
    E -->|Yes| F[CONFLICT: manual resolution needed]
    E -->|No| G[Auto-merge succeeds]`,
      },
    ],
    technology: ['git'],
    files: ['src/api/routes.ts'],
    project: 'api-service',
    concepts: ['git', 'debugging'],
    user_solved_unaided: true,
    occurrences: 2,
  },
];

async function seed() {
  console.log('🌱 Seeding Errata Demo Data (12 rich error scenarios)...\n');

  if (isConfigured()) {
    console.log('✅ Connected to Neo4j. Initializing schema constraints...');
    await initNeo4jSchema();
  } else {
    console.log('⚠️  Neo4j not configured; seeding in-memory store only.');
  }

  const idMap: Record<number, string> = {};

  for (let i = 0; i < ERRORS.length; i++) {
    const e = ERRORS[i];
    const { occurrences, ...base } = e;


    const first = await logResolution({ ...base, user_solved_unaided: false });
    idMap[i] = first.error_class_id;
    console.log(`[${i + 1}/12] ${first.title}`);

    for (let occ = 1; occ < occurrences; occ++) {
      await logResolution({
        ...base,
        matched_error_class_id: first.error_class_id,
        user_solved_unaided: occ % 2 === 0,
      });
    }
  }

  console.log('\n✅ Seeding completed! Dashboard now has:');
  console.log(`   • ${ERRORS.length} error classes`);
  console.log(`   • ${ERRORS.reduce((sum, e) => sum + e.occurrences, 0)} total occurrences`);
  console.log(`   • Multiple projects: ${[...new Set(ERRORS.map((e) => e.project))].join(', ')}`);
  console.log(`   • Technologies: ${[...new Set(ERRORS.flatMap((e) => e.technology))].join(', ')}`);
}

seed().catch(console.error);
