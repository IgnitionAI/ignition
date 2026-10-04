import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { checkpointCatalogSchema, loadCatalogCheckpoint, type CheckpointContract, type CheckpointEntry } from '../src/catalog';

// A consumer's semantic contract; it is not inferred from the downloaded manifest.
const expected: CheckpointContract = {
  algorithm: 'fixture-agent', checkpointFormat: 'native-fixture-v1',
  environment: { id: 'point-mass-v1', version: '1' },
  observation: { id: 'position-velocity', version: '1', shape: [2] },
  action: { kind: 'box', id: 'acceleration', version: '1', shape: [1], low: [-2], high: [2] },
};
const nativeSchema = z.object({ version: z.literal('native-fixture-v1'), weights: z.tuple([z.number().finite()]) }).strict();
const native = { version: 'native-fixture-v1', weights: [0.25] };
function fixture(payload: unknown = native, contract: CheckpointContract = expected) {
  const bytes = new TextEncoder().encode(JSON.stringify({ format: 'ignition-checkpoint-envelope-v1',
    environment: contract.environment.id, contract, checkpoint: payload }));
  const entry: CheckpointEntry = {
    id: 'point-mass-seed-11', name: 'Fixture policy', contract: expected,
    artifact: { source: { type: 'local', path: '/models/checkpoints/seed-11.json' },
      bytes: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex') },
    provenance: { sourceCommit: 'a'.repeat(40), seed: 11, samples: 20000, updates: 9751, backend: 'tfjs-cpu',
      createdAt: '2026-10-04T10:00:00.000Z', source: 'https://example.com/source' },
    license: { id: 'MIT', source: 'https://example.com/license', note: 'Declared package license' },
    evaluation: { protocol: 'point-mass-protocol-v1', protocolSource: '/models/protocol.json',
      report: '/models/report.json', episodes: 100, successes: 100, meanCost: 6 },
    limits: ['Controlled physical task only'],
  };
  return { bytes, entry };
}
const response = (bytes: Uint8Array) => new Response(bytes as BodyInit, { status: 200 });

describe('Versioned checkpoint catalogue public loader', () => {
  it('delivers exact validated native data from local and pinned public HF transports', async () => {
    const { bytes, entry } = fixture();
    const fetcher = vi.fn<typeof fetch>(async () => response(bytes));
    expect(await loadCatalogCheckpoint(entry, expected, value => nativeSchema.parse(value), fetcher)).toEqual(native);
    entry.artifact.source = { type: 'huggingface', repoId: 'owner/checkpoints', revision: 'b'.repeat(40), file: 'policies/seed-11.json' };
    expect(await loadCatalogCheckpoint(entry, expected, value => nativeSchema.parse(value), fetcher)).toEqual(native);
    expect(fetcher.mock.calls.map(([url, init]) => [url, init?.credentials])).toEqual([
      ['/models/checkpoints/seed-11.json', 'omit'],
      [`https://huggingface.co/owner/checkpoints/resolve/${'b'.repeat(40)}/policies/seed-11.json`, 'omit'],
    ]);
  });

  it('refuses a semantic observation version mismatch before requesting or admitting a policy', async () => {
    const { entry } = fixture(); entry.contract = { ...expected, observation: { ...expected.observation, version: '2' } };
    const fetcher = vi.fn<typeof fetch>();
    await expect(loadCatalogCheckpoint(entry, expected, value => nativeSchema.parse(value), fetcher)).rejects.toThrow('Incompatible');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects a differently contracted envelope despite valid metadata and integrity', async () => {
    const { entry, bytes } = fixture(native, { ...expected, environment: { id: 'another-environment', version: '1' } });
    await expect(loadCatalogCheckpoint(entry, expected, value => nativeSchema.parse(value), async () => response(bytes))).rejects.toThrow('Incompatible');
  });

  it('rejects corruption and truncated/oversized responses before native validation', async () => {
    const { bytes, entry } = fixture();
    const mutated = new Uint8Array(bytes); mutated[mutated.length - 1] ^= 1;
    for (const [body, message] of [[mutated, 'SHA-256'], [bytes.slice(0, -1), 'byte size'],
      [new Uint8Array([...bytes, 0]), 'byte size']] as const) {
      await expect(loadCatalogCheckpoint(entry, expected, value => nativeSchema.parse(value), async () => response(body))).rejects.toThrow(message);
    }
  });

  it('propagates native format refusal and HTTP unavailability without returning fallback data', async () => {
    const malformed = fixture({ version: 'native-old', weights: [0.25] });
    await expect(loadCatalogCheckpoint(malformed.entry, expected, value => nativeSchema.parse(value), async () => response(malformed.bytes))).rejects.toThrow('native-fixture-v1');
    const { entry } = fixture();
    await expect(loadCatalogCheckpoint(entry, expected, value => nativeSchema.parse(value), async () => new Response('missing', { status: 404 }))).rejects.toThrow('HTTP 404');
  });

  it('rejects a catalogue with unidentified evaluation protocol, duplicate IDs or mutable HF revision', () => {
    const { entry } = fixture();
    for (const protocol of ['', '   ']) {
      expect(() => checkpointCatalogSchema.parse({ format: 'ignition-checkpoint-catalog-v1', models: [
        { ...entry, evaluation: { ...entry.evaluation, protocol } },
      ] })).toThrow();
    }
    expect(() => checkpointCatalogSchema.parse({ format: 'ignition-checkpoint-catalog-v1', models: [entry, entry] })).toThrow('Duplicate');
    entry.artifact.source = { type: 'huggingface', repoId: 'owner/checkpoints', revision: 'main', file: 'seed.json' };
    expect(() => checkpointCatalogSchema.parse({ format: 'ignition-checkpoint-catalog-v1', models: [entry] })).toThrow();
  });
});
