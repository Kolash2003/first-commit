import crypto from 'crypto';

export const EMBEDDING_DIMENSION = 384;

/**
 * Calculates cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates a normalized 384-dimensional dense semantic embedding vector for a given text.
 * Uses sub-word token n-grams and feature hashing with L2 unit normalization.
 * This guarantees offline operation without network or huge model downloads,
 * producing consistent 384-float vectors that can be indexed in Neo4j vector index.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const normalized = (text || '').toLowerCase().trim();
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);

  if (!normalized) {
    return vector;
  }

  // Tokenize words and character n-grams (3 to 5 chars) for semantic capture
  const words = normalized.split(/[^a-z0-9_]+/);
  const features: string[] = [];

  for (const word of words) {
    if (!word) continue;
    features.push(word);
    for (let n = 3; n <= Math.min(5, word.length); n++) {
      for (let i = 0; i <= word.length - n; i++) {
        features.push(word.substring(i, i + n));
      }
    }
  }

  // Hash each feature into the 384-dim vector space
  for (const feat of features) {
    const hash = crypto.createHash('md5').update(feat).digest();
    const idx = hash.readUInt16BE(0) % EMBEDDING_DIMENSION;
    const sign = (hash.readUInt8(2) % 2 === 0) ? 1 : -1;
    vector[idx] += sign;
  }

  // L2 unit normalization
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
}
