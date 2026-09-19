import crypto from 'crypto';

export interface NormalizationResult {
  normalizedMessage: string;
  errorType: string;
  topStackFrameSignature: string;
  template: string;
  fingerprint: string;
}

/**
 * Normalizes error messages and stack traces to produce a deterministic SHA-256 fingerprint.
 * Follows the pipeline defined in DESIGN.md §7.1.
 */
export function normalizeError(
  errorMessage: string,
  stackTrace?: string
): NormalizationResult {
  const rawMsg = errorMessage || '';

  // 1. Extract error type (e.g., "Error: listen EADDRINUSE", "TypeError", "ECONNREFUSED", etc.)
  const typeMatch =
    rawMsg.match(/^([A-Z][a-zA-Z0-9_]*Error|[A-Z_]{3,}|\bE[A-Z0-9_]+\b)/i) ||
    rawMsg.match(/(?:error|code):\s*([a-z0-9_]+)/i);
  const errorType = typeMatch ? typeMatch[1].toLowerCase() : 'generic_error';

  // 2. Normalize error message:
  let normalized = rawMsg;

  // 2a. Strip quoted strings ('...', "...", `...`)
  normalized = normalized.replace(/(['"`])(?:(?=(\\?))\2[\s\S])*?\1/g, '<str>');

  // 2b. Strip absolute paths (/home/... or C:\...) keeping only the basename
  normalized = normalized.replace(/(?:[a-zA-Z]:\\|\/)[^\s:)'"]+/g, (match) => {
    const parts = match.split(/[/\\]/);
    return parts[parts.length - 1] || '<path>';
  });

  // 2c. Strip UUIDs
  normalized = normalized.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    '<uuid>'
  );

  // 2d. Strip hex addresses (e.g., 0x7ffd9b8a)
  normalized = normalized.replace(/\b0x[0-9a-f]+\b/gi, '<hex>');

  // 2e. Strip ports (e.g. :::3000, :8080, port 3000)
  normalized = normalized.replace(/(?:::|:|\bport\s+)\d{2,5}\b/gi, ':PORT');

  // 2f. Strip timestamps (e.g. 2026-09-19T17:49:48 or 17:49:48)
  normalized = normalized.replace(
    /\b\d{4}-\d{2}-\d{2}(?:T|\s+)\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/gi,
    '<timestamp>'
  );

  // 2g. Strip general numeric literals (counters, line/col numbers)
  normalized = normalized.replace(/\b\d+\b/g, '<num>');

  // 2h. Normalize whitespace and case
  normalized = normalized.replace(/\s+/g, ' ').trim().toLowerCase();

  // 3. Process top in-project stack frame signature
  let topStackFrameSignature = '';
  if (stackTrace) {
    const lines = stackTrace.split('\n');
    for (const line of lines) {
      // Look for lines containing "at ... (...) or at ..."
      const trimmed = line.trim();
      if (trimmed.startsWith('at ') && !trimmed.includes('node:internal') && !trimmed.includes('node_modules')) {
        // Strip line and column numbers
        const cleanedFrame = trimmed
          .replace(/(?:[a-zA-Z]:\\|\/)[^\s:)'"]+/g, (match) => {
            const parts = match.split(/[/\\]/);
            return parts[parts.length - 1];
          })
          .replace(/:\d+:\d+/g, '')
          .replace(/:\d+/g, '')
          .replace(/\s+/g, ' ')
          .toLowerCase();
        topStackFrameSignature = cleanedFrame;
        break;
      }
    }
  }

  // 4. Construct template
  const template = `${errorType}|${normalized}|${topStackFrameSignature}`;

  // 5. Compute SHA-256 fingerprint
  const fingerprint = crypto
    .createHash('sha256')
    .update(template)
    .digest('hex');

  return {
    normalizedMessage: normalized,
    errorType,
    topStackFrameSignature,
    template,
    fingerprint,
  };
}
