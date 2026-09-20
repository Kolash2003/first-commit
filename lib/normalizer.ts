import crypto from 'crypto';

export interface NormalizationResult {
  normalizedMessage: string;
  errorType: string;
  topStackFrameSignature: string;
  template: string;
  fingerprint: string;
}


export function normalizeError(
  errorMessage: string,
  stackTrace?: string
): NormalizationResult {
  const rawMsg = errorMessage || '';


  const typeMatch =
    rawMsg.match(/^([A-Z][a-zA-Z0-9_]*Error|[A-Z_]{3,}|\bE[A-Z0-9_]+\b)/i) ||
    rawMsg.match(/(?:error|code):\s*([a-z0-9_]+)/i);
  const errorType = typeMatch ? typeMatch[1].toLowerCase() : 'generic_error';


  let normalized = rawMsg;


  normalized = normalized.replace(/(['"`])(?:(?=(\\?))\2[\s\S])*?\1/g, '<str>');


  normalized = normalized.replace(/(?:[a-zA-Z]:\\|\/)[^\s:)'"]+/g, (match) => {
    const parts = match.split(/[/\\]/);
    return parts[parts.length - 1] || '<path>';
  });


  normalized = normalized.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    '<uuid>'
  );


  normalized = normalized.replace(/\b0x[0-9a-f]+\b/gi, '<hex>');


  normalized = normalized.replace(/(?:::|:|\bport\s+)\d{2,5}\b/gi, ':PORT');


  normalized = normalized.replace(
    /\b\d{4}-\d{2}-\d{2}(?:T|\s+)\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/gi,
    '<timestamp>'
  );


  normalized = normalized.replace(/\b\d+\b/g, '<num>');


  normalized = normalized.replace(/\s+/g, ' ').trim().toLowerCase();


  let topStackFrameSignature = '';
  if (stackTrace) {
    const lines = stackTrace.split('\n');
    for (const line of lines) {

      const trimmed = line.trim();
      if (trimmed.startsWith('at ') && !trimmed.includes('node:internal') && !trimmed.includes('node_modules')) {

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


  const template = `${errorType}|${normalized}|${topStackFrameSignature}`;

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
