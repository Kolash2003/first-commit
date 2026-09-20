// DESIGN §7.2: embeddings run locally via Transformers.js (all-MiniLM-L6-v2,
// 384 dims) — no API key, fully offline, consistent with local-first (§2).
// We attempt to load @huggingface/transformers if installed; otherwise fall
// back to a deterministic 384-dim hash embedding (same dimension so the
// Neo4j vector index never mismatches). No cloud calls, ever.

import crypto from 'crypto';

export const EMBEDDING_DIMENSION = 384;
export const LOCAL_EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2';

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

type TransformerPipeline = (text: string, opts?: unknown) => Promise<unknown>;

let pipelinePromise: Promise<TransformerPipeline | null> | null = null;

async function getLocalPipeline(): Promise<TransformerPipeline | null> {
  if (process.env.ERRATA_DISABLE_LOCAL_MODEL === '1') return null;
  if (pipelinePromise) return pipelinePromise;
  pipelinePromise = (async () => {
    try {
      const mod = await Function(
        'return import("@huggingface/transformers")'
      )() as { pipeline: (task: string, model: string) => Promise<TransformerPipeline> };
      if (!mod?.pipeline) return null;
      return await mod.pipeline('feature-extraction', LOCAL_EMBED_MODEL);
    } catch {
      return null;
    }
  })();
  return pipelinePromise;
}

export async function isLocalModelAvailable(): Promise<boolean> {
  return (await getLocalPipeline()) !== null;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const normalized = (text || '').toLowerCase().trim();
  if (!normalized) {
    return new Array<number>(EMBEDDING_DIMENSION).fill(0);
  }

  try {
    const pipe = await getLocalPipeline();
    if (pipe) {
      const out = (await pipe(normalized, { pooling: 'mean', normalize: true })) as
        | { data?: ArrayLike<number>; dims?: number[] }
        | { tolist?: () => number[][] };
      let vec: number[] | null = null;
      if (out && typeof out === 'object' && 'data' in out && out.data) {
        vec = Array.from(out.data as ArrayLike<number>);
      } else if (out && typeof (out as { tolist?: unknown }).tolist === 'function') {
        const rows = (out as { tolist: () => number[][] }).tolist();
        if (Array.isArray(rows) && rows.length > 0) vec = rows[0];
      }
      if (vec && vec.length > 0) {
        const fixed =
          vec.length === EMBEDDING_DIMENSION
            ? vec
            : vec.length > EMBEDDING_DIMENSION
              ? vec.slice(0, EMBEDDING_DIMENSION)
              : [...vec, ...new Array<number>(EMBEDDING_DIMENSION - vec.length).fill(0)];
        let n = 0;
        for (const v of fixed) n += v * v;
        n = Math.sqrt(n);
        if (n > 0) return fixed.map((v) => Number((v / n).toFixed(6)));
        return fixed.map((v) => Number(v.toFixed(6)));
      }
    }
  } catch (err) {
    console.warn('Local transformer embedding failed; using hash fallback:', (err as Error)?.message);
  }

  return generateHashEmbedding(normalized);
}

export function generateHashEmbedding(normalizedText: string): number[] {
  const normalized = (normalizedText || '').toLowerCase().trim();
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);

  if (!normalized) {
    return vector;
  }

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

  for (const feat of features) {
    const hash = crypto.createHash('md5').update(feat).digest();
    const idx = hash.readUInt16BE(0) % EMBEDDING_DIMENSION;
    const sign = (hash.readUInt8(2) % 2 === 0) ? 1 : -1;
    vector[idx] += sign;
  }

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
