import { getTTSText } from '@/lib/concept-resources';

export function speakConcept(conceptName: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const key = conceptName.toLowerCase().replace(/\s+/g, '-');
  const fallback: Record<string, string> = {
    ports:
      'A port is a 16-bit number that multiplexes connections to a single IP address. Only one listener can bind to a port at a time.',
    'process-management':
      'Process management involves controlling running programs — finding their IDs, sending signals, and ensuring they start and stop cleanly.',
    networking:
      'Networking is how computers exchange data. HTTP requests travel from browser to server via TCP connections.',
    cors: 'Cross-Origin Resource Sharing allows or blocks browser requests to a different domain. Servers must opt in with Access-Control-Allow-Origin headers.',
    authentication:
      'Authentication verifies who you are. JSON Web Tokens encode claims signed by a secret key, verified without a database lookup.',
    recursion:
      'Recursion is when a function calls itself. Every recursive function needs a base case that stops the calls, or the stack overflows.',
    'call-stack':
      'The call stack is a LIFO structure that tracks active function calls. When it grows too large, a stack overflow error is thrown.',
    ssr: 'Server-side rendering generates HTML on the server. React hydration makes it interactive on the client — but both renders must produce identical output.',
    git: 'Git tracks file changes over time. Merge conflicts occur when two branches modify the same lines — you must manually choose the correct version.',
    'connection-pooling':
      'Connection pooling reuses existing database connections instead of opening new ones for each request, preventing connection limit exhaustion.',
  };
  const text = fallback[key] || getTTSText(conceptName);
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}
