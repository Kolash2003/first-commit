

export interface ConceptResource {
  title: string;
  url: string;
  type: 'docs' | 'guide' | 'video' | 'article';
  description: string;
}

export const CONCEPT_RESOURCES: Record<string, ConceptResource[]> = {
  'ports': [
    {
      title: 'MDN: TCP/IP Fundamentals',
      url: 'https://developer.mozilla.org/en-US/docs/Glossary/Port',
      type: 'docs',
      description: 'A port is a 16-bit number (0–65535) that multiplexes connections to a single IP address.',
    },
    {
      title: 'Node.js: net.Server.listen()',
      url: 'https://nodejs.org/api/net.html#serverlisten',
      type: 'docs',
      description: 'How Node.js binds a TCP socket to a port via the OS kernel.',
    },
  ],
  'process-management': [
    {
      title: 'Linux: lsof command guide',
      url: 'https://www.man7.org/linux/man-pages/man8/lsof.8.html',
      type: 'docs',
      description: 'List open files and the processes that opened them, including network sockets.',
    },
    {
      title: 'Node.js: process module',
      url: 'https://nodejs.org/api/process.html',
      type: 'docs',
      description: 'Access and control the current Node.js process — PID, signals, exit.',
    },
  ],
  'networking': [
    {
      title: 'MDN: HTTP overview',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
      type: 'docs',
      description: 'The foundation of data communication for the web.',
    },
    {
      title: "Cloudflare: What is TCP/IP?",
      url: 'https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/',
      type: 'article',
      description: 'A clear explanation of how TCP/IP packets travel across the internet.',
    },
  ],
  'async-rendering': [
    {
      title: 'React: useEffect hook',
      url: 'https://react.dev/reference/react/useEffect',
      type: 'docs',
      description: 'Synchronize a component with an external system after render.',
    },
    {
      title: 'React: Loading states with Suspense',
      url: 'https://react.dev/reference/react/Suspense',
      type: 'docs',
      description: 'Display a fallback until child components have finished loading.',
    },
  ],
  'optional-chaining': [
    {
      title: 'MDN: Optional chaining (?.)',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
      type: 'docs',
      description: 'Access deeply nested properties without throwing if any reference is null.',
    },
  ],
  'react-state': [
    {
      title: 'React: useState hook',
      url: 'https://react.dev/reference/react/useState',
      type: 'docs',
      description: 'Add state to a function component.',
    },
    {
      title: 'React: Managing State guide',
      url: 'https://react.dev/learn/managing-state',
      type: 'guide',
      description: 'How to structure state so components remain in sync.',
    },
  ],
  'connection-pooling': [
    {
      title: 'PostgreSQL: Connection Pooling',
      url: 'https://www.postgresql.org/docs/current/runtime-config-connection.html',
      type: 'docs',
      description: 'Configure max_connections and reuse connections via PgBouncer.',
    },
    {
      title: 'PgBouncer documentation',
      url: 'https://www.pgbouncer.org/usage.html',
      type: 'docs',
      description: 'Lightweight connection pooler for PostgreSQL.',
    },
  ],
  'database-concurrency': [
    {
      title: 'PostgreSQL: Concurrency Control',
      url: 'https://www.postgresql.org/docs/current/mvcc.html',
      type: 'docs',
      description: 'MVCC and how PostgreSQL handles simultaneous read/write access.',
    },
  ],
  'resource-leaks': [
    {
      title: 'Node.js: Async resource management',
      url: 'https://nodejs.org/api/async_context.html',
      type: 'docs',
      description: 'Track and clean up async resources in Node.js.',
    },
  ],
  'cors': [
    {
      title: 'MDN: CORS',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
      type: 'docs',
      description: 'Cross-Origin Resource Sharing — why browsers block certain requests and how to configure the Access-Control-Allow-Origin header.',
    },
    {
      title: 'Express.js: cors middleware',
      url: 'https://expressjs.com/en/resources/middleware/cors.html',
      type: 'docs',
      description: 'One-liner CORS setup for Express applications.',
    },
  ],
  'authentication': [
    {
      title: 'JWT.io Introduction',
      url: 'https://jwt.io/introduction',
      type: 'guide',
      description: 'Understand JSON Web Token structure, signing, and verification.',
    },
    {
      title: 'MDN: HTTP Authentication',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication',
      type: 'docs',
      description: 'The Authorization header, Bearer tokens, and Basic auth.',
    },
  ],
  'recursion': [
    {
      title: 'MDN: Recursion guide',
      url: 'https://developer.mozilla.org/en-US/docs/Glossary/Recursion',
      type: 'docs',
      description: 'A function that calls itself — base cases and the call stack.',
    },
  ],
  'call-stack': [
    {
      title: 'MDN: Call stack',
      url: 'https://developer.mozilla.org/en-US/docs/Glossary/Call_stack',
      type: 'docs',
      description: 'How JavaScript tracks active function calls and why stack overflow happens.',
    },
  ],
  'ssr': [
    {
      title: 'Next.js: Server-side Rendering',
      url: 'https://nextjs.org/docs/app/building-your-application/rendering/server-components',
      type: 'docs',
      description: 'How Next.js renders pages on the server and hydrates them on the client.',
    },
    {
      title: 'Next.js: Hydration errors',
      url: 'https://nextjs.org/docs/messages/react-hydration-error',
      type: 'guide',
      description: 'Diagnose and fix hydration mismatch errors in Next.js.',
    },
  ],
  'debugging': [
    {
      title: 'Node.js Debugger',
      url: 'https://nodejs.org/en/guides/debugging-getting-started',
      type: 'guide',
      description: 'Use the built-in Node.js inspector and Chrome DevTools to debug.',
    },
  ],
  'event-loop': [
    {
      title: 'Node.js: Event Loop explained',
      url: 'https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick',
      type: 'docs',
      description: 'How Node.js handles async operations without blocking the thread.',
    },
    {
      title: 'MDN: Concurrency model and event loop',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop',
      type: 'docs',
      description: 'The JavaScript runtime model — call stack, task queue, microtasks.',
    },
  ],
  'python-venv': [
    {
      title: 'Python: venv — Virtual Environments',
      url: 'https://docs.python.org/3/library/venv.html',
      type: 'docs',
      description: 'Create isolated Python environments so packages don\'t conflict globally.',
    },
  ],
  'git': [
    {
      title: 'Git: Basic Merging',
      url: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging',
      type: 'guide',
      description: 'How git merges branches and what to do when conflicts arise.',
    },
    {
      title: 'Atlassian: Resolving merge conflicts',
      url: 'https://www.atlassian.com/git/tutorials/using-branches/merge-conflicts',
      type: 'guide',
      description: 'Step-by-step guide to understanding and resolving git merge conflicts.',
    },
  ],
};

export function getResourcesForConcept(conceptName: string): ConceptResource[] {
  const key = conceptName.toLowerCase().replace(/\s+/g, '-');
  return CONCEPT_RESOURCES[key] || CONCEPT_RESOURCES[conceptName] || [];
}

export function getTTSText(conceptName: string): string {
  const resources = getResourcesForConcept(conceptName);
  if (resources.length > 0) {
    return resources[0].description;
  }
  return `The concept of ${conceptName} is an important foundation in software development.`;
}
