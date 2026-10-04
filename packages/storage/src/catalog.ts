import { z } from 'zod';

const MAX_ARTIFACT_BYTES = 20 * 1024 * 1024;
const shape = z.tuple([z.number().int().positive().max(1000000)]);
const id = z.string().min(1).max(100).refine(value => value.trim().length > 0, 'Expected a nonblank identifier');
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const revision = z.string().regex(/^[a-f0-9]{40}$/);
const relativeFile = z.string().max(500).refine(path => path.split('/').every(segment =>
  /^[a-zA-Z0-9._-]+$/.test(segment) && segment !== '.' && segment !== '..'), 'Invalid file path');
const localFile = z.string().refine(path => path.startsWith('/') && !path.startsWith('//')
  && relativeFile.safeParse(path.slice(1)).success, 'Expected an absolute local asset path');
const documentLink = z.union([localFile, z.string().url().refine(url => url.startsWith('https://'))]);
const source = z.discriminatedUnion('type', [
  z.object({ type: z.literal('local'), path: localFile }).strict(),
  z.object({ type: z.literal('huggingface'), repoId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/),
    revision, file: relativeFile }).strict(),
]);
const box = z.object({ kind: z.literal('box'), id, version: id, shape,
  low: z.array(z.number().finite()), high: z.array(z.number().finite()) }).strict().superRefine((value, context) => {
  if (value.low.length !== value.shape[0] || value.high.length !== value.shape[0]
    || value.low.some((low, index) => !(value.high[index] > low) || !Number.isFinite(value.high[index] - low))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid action bounds/dimensions' });
  }
});

export const checkpointContractSchema = z.object({
  algorithm: id, checkpointFormat: id,
  environment: z.object({ id, version: id }).strict(),
  observation: z.object({ id, version: id, shape }).strict(),
  action: z.union([box, z.object({ kind: z.literal('discrete'), id, version: id,
    count: z.number().int().positive().max(1000000) }).strict()]),
}).strict();

export const checkpointEntrySchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), name: z.string().min(1).max(200),
  contract: checkpointContractSchema,
  artifact: z.object({ source, sha256: hash, bytes: z.number().int().positive().max(MAX_ARTIFACT_BYTES) }).strict(),
  provenance: z.object({ sourceCommit: revision, seed: z.number().int().nonnegative(),
    samples: z.number().int().nonnegative(), updates: z.number().int().nonnegative(), backend: id,
    createdAt: z.string().datetime(), source: documentLink }).strict(),
  license: z.object({ id, source: documentLink, note: z.string().min(1).max(500) }).strict(),
  evaluation: z.object({ protocol: id, protocolSource: documentLink, report: documentLink,
    episodes: z.number().int().positive(), successes: z.number().int().nonnegative(),
    meanCost: z.number().finite().nonnegative().optional() }).strict()
    .refine(value => value.successes <= value.episodes, 'Successes exceed evaluated episodes'),
  limits: z.array(z.string().min(1).max(1000)).min(1).max(20),
}).strict();

export const checkpointCatalogSchema = z.object({
  format: z.literal('ignition-checkpoint-catalog-v1'), models: z.array(checkpointEntrySchema).min(1).max(100),
}).strict().refine(value => new Set(value.models.map(model => model.id)).size === value.models.length,
  'Duplicate checkpoint IDs');
export type CheckpointContract = z.infer<typeof checkpointContractSchema>;
export type CheckpointEntry = z.infer<typeof checkpointEntrySchema>;
export type CheckpointCatalog = z.infer<typeof checkpointCatalogSchema>;

const envelopeSchema = z.object({
  format: z.literal('ignition-checkpoint-envelope-v1'), environment: id,
  contract: checkpointContractSchema, checkpoint: z.unknown().refine(value => value !== undefined, 'Missing checkpoint'),
}).strict();

function assertCompatible(actual: CheckpointContract, expected: CheckpointContract): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Incompatible checkpoint contract');
}
export function getCheckpointArtifactURL(value: unknown): string {
  const file = checkpointEntrySchema.parse(value).artifact.source;
  if (file.type === 'local') return file.path;
  return `https://huggingface.co/${file.repoId}/resolve/${file.revision}/${file.file.split('/').map(encodeURIComponent).join('/')}`;
}
async function readBounded(response: Response, expectedBytes: number): Promise<ArrayBuffer> {
  if (!response.body) throw new Error('Checkpoint response has no body');
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > expectedBytes) { await reader.cancel(); throw new Error('Checkpoint byte size mismatch'); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  if (total !== expectedBytes) throw new Error('Checkpoint byte size mismatch');
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}

/** Integrity/semantic checks precede the caller's native agent-format validator. */
export async function loadCatalogCheckpoint<T>(
  value: unknown, expectedContract: CheckpointContract, validateNative: (checkpoint: unknown) => T,
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const entry = checkpointEntrySchema.parse(value), expected = checkpointContractSchema.parse(expectedContract);
  assertCompatible(entry.contract, expected);
  const response = await fetcher(getCheckpointArtifactURL(entry), { credentials: 'omit' });
  if (!response.ok) throw new Error(`Checkpoint unavailable: HTTP ${response.status}`);
  const bytes = await readBounded(response, entry.artifact.bytes);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const actualHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  if (actualHash !== entry.artifact.sha256) throw new Error('Checkpoint SHA-256 mismatch');
  const envelope = envelopeSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  assertCompatible(envelope.contract, expected);
  if (envelope.environment !== expected.environment.id) throw new Error('Incompatible checkpoint environment');
  return validateNative(envelope.checkpoint);
}
