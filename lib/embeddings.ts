import crypto from 'crypto';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export const EMBEDDING_DIMENSION = 1024;
export const BEDROCK_EMBED_MODEL =
  process.env.BEDROCK_EMBED_MODEL || 'amazon.titan-embed-text-v2:0';

const BEDROCK_REGION =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';

function getBedrockApiKey(): string | null {
  return process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.BEDROCK_API_KEY || null;
}

let bedrockClient: BedrockRuntimeClient | null | undefined;

export function isBedrockConfigured(): boolean {
  return Boolean(getBedrockApiKey() || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION);
}

function getBedrockClient(): BedrockRuntimeClient | null {
  if (bedrockClient !== undefined) return bedrockClient;
  if (!isBedrockConfigured()) {
    bedrockClient = null;
    return bedrockClient;
  }
  try {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
    });
  } catch {
    bedrockClient = null;
  }
  return bedrockClient;
}

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

async function invokeBedrockViaApiKey(apiKey: string, text: string): Promise<number[] | null> {
  const url = `https://bedrock-runtime.${BEDROCK_REGION}.amazonaws.com/model/${BEDROCK_EMBED_MODEL}/invoke`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputText: text,
      dimensions: EMBEDDING_DIMENSION,
      normalize: true,
    }),
  });
  if (!res.ok) {
    throw new Error(`Bedrock HTTP ${res.status}: ${(await res.text()).substring(0, 200)}`);
  }
  const payload = await res.json();
  const vector: unknown = payload.embedding;
  if (
    Array.isArray(vector) &&
    vector.length === EMBEDDING_DIMENSION &&
    vector.every((v) => typeof v === 'number')
  ) {
    return (vector as number[]).map((v) => Number(v.toFixed(6)));
  }
  console.warn(
    `Bedrock returned unexpected embedding shape (len=${Array.isArray(vector) ? vector.length : 'n/a'}); using offline fallback.`
  );
  return null;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const normalized = (text || '').toLowerCase().trim();
  if (!normalized) {
    return new Array<number>(EMBEDDING_DIMENSION).fill(0);
  }

  const apiKey = getBedrockApiKey();
  if (apiKey) {
    try {
      const vector = await invokeBedrockViaApiKey(apiKey, normalized);
      if (vector) return vector;
    } catch (err: any) {
      console.warn(
        `Bedrock embedding failed (${err?.name || 'Error'}: ${err?.message || String(err)}); using offline fallback.`
      );
    }
    return generateHashEmbedding(normalized);
  }

  const client = getBedrockClient();
  if (client) {
    try {
      const command = new InvokeModelCommand({
        modelId: BEDROCK_EMBED_MODEL,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: normalized,
          dimensions: EMBEDDING_DIMENSION,
          normalize: true,
        }),
      });
      const response = await client.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.body));
      const vector: unknown = payload.embedding;
      if (
        Array.isArray(vector) &&
        vector.length === EMBEDDING_DIMENSION &&
        vector.every((v) => typeof v === 'number')
      ) {
        return (vector as number[]).map((v) => Number(v.toFixed(6)));
      }
      console.warn(
        `Bedrock returned unexpected embedding shape (len=${Array.isArray(vector) ? vector.length : 'n/a'}); using offline fallback.`
      );
    } catch (err: any) {
      console.warn(
        `Bedrock embedding failed (${err?.name || 'Error'}: ${err?.message || String(err)}); using offline fallback.`
      );
    }
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
