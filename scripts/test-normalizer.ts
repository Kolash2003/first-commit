import { normalizeError } from '../lib/normalizer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

console.log('--- Testing Layer 1 Fingerprint Normalizer ---');

// Test 1: Port variations should have identical fingerprint
const errPort3000 = 'Error: listen EADDRINUSE: address already in use :::3000';
const errPort8080 = 'Error: listen EADDRINUSE: address already in use :::8080';
const norm3000 = normalizeError(errPort3000);
const norm8080 = normalizeError(errPort8080);
assert(
  norm3000.fingerprint === norm8080.fingerprint,
  `EADDRINUSE :::3000 and :::8080 produce identical fingerprint (${norm3000.fingerprint.substring(0, 8)})`
);

// Test 2: Absolute path variations should have identical fingerprint
const stackPath1 = 'at doListen (/home/aneesh/Desktop/developer/first-commit/src/server.ts:42:10)';
const stackPath2 = 'at doListen (/var/deploy/production-api/src/server.ts:184:22)';
const normPath1 = normalizeError(errPort3000, stackPath1);
const normPath2 = normalizeError(errPort3000, stackPath2);
assert(
  normPath1.fingerprint === normPath2.fingerprint,
  `Different absolute paths with same basename produce identical fingerprint (${normPath1.fingerprint.substring(0, 8)})`
);

// Test 3: Quoted strings variations should have identical fingerprint
const msgQuote1 = 'TypeError: Cannot read properties of undefined (reading "items")';
const msgQuote2 = "TypeError: Cannot read properties of undefined (reading 'records')";
const normQ1 = normalizeError(msgQuote1);
const normQ2 = normalizeError(msgQuote2);
assert(
  normQ1.fingerprint === normQ2.fingerprint,
  `Quoted string variation in property access produces identical fingerprint (${normQ1.fingerprint.substring(0, 8)})`
);

// Test 4: Distinct error types should have different fingerprints
const normTypeErr = normalizeError('TypeError: undefined is not a function');
assert(
  norm3000.fingerprint !== normTypeErr.fingerprint,
  'Different error categories produce distinct fingerprints'
);

console.log('All normalizer tests passed successfully!');
