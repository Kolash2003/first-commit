export const CONCEPT_URLS: Record<string, { url: string; label: string }> = {
  ports: { url: 'https://developer.mozilla.org/en-US/docs/Glossary/Port', label: 'MDN: Ports' },
  'process-management': { url: 'https://nodejs.org/api/process.html', label: 'Node.js Process' },
  networking: { url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', label: 'MDN: HTTP' },
  'async-rendering': { url: 'https://react.dev/reference/react/useEffect', label: 'React: useEffect' },
  'optional-chaining': {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
    label: 'MDN: ?.',
  },
  'react-state': { url: 'https://react.dev/reference/react/useState', label: 'React: useState' },
  'connection-pooling': { url: 'https://www.pgbouncer.org/usage.html', label: 'PgBouncer Docs' },
  'database-concurrency': { url: 'https://www.postgresql.org/docs/current/mvcc.html', label: 'PostgreSQL MVCC' },
  'resource-leaks': { url: 'https://nodejs.org/api/async_context.html', label: 'Node.js Async' },
  cors: { url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', label: 'MDN: CORS' },
  authentication: { url: 'https://jwt.io/introduction', label: 'JWT.io' },
  recursion: { url: 'https://developer.mozilla.org/en-US/docs/Glossary/Recursion', label: 'MDN: Recursion' },
  'call-stack': { url: 'https://developer.mozilla.org/en-US/docs/Glossary/Call_stack', label: 'MDN: Call Stack' },
  ssr: { url: 'https://nextjs.org/docs/messages/react-hydration-error', label: 'Next.js Hydration' },
  'python-venv': { url: 'https://docs.python.org/3/library/venv.html', label: 'Python venv' },
  git: {
    url: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging',
    label: 'Git Merging',
  },
  debugging: { url: 'https://nodejs.org/en/guides/debugging-getting-started', label: 'Node.js Debugger' },
  'event-loop': {
    url: 'https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick',
    label: 'Event Loop',
  },
};
