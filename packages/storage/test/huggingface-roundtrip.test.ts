import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { HuggingFaceProvider } from '../src/providers/huggingface';

const transport = vi.hoisted(() => ({ files: new Map<string, Blob>() }));
vi.mock('@huggingface/hub', () => ({
  createRepo: vi.fn().mockResolvedValue(undefined),
  uploadFiles: vi.fn(async ({ files }: { files: { path: string; content: Blob }[] }) => {
    for (const file of files) transport.files.set(file.path, file.content);
  }),
  commit: vi.fn().mockResolvedValue(undefined),
}));

const config = { token: 'hf_transport_fixture', repoId: 'test-owner/test-repository' };
const requests: { path: string; authorization: string | null }[] = [];
const models: tf.LayersModel[] = [];

beforeEach(async () => {
  transport.files.clear(); requests.length = 0;
  await tf.setBackend('cpu'); await tf.ready();
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const path = url.pathname.split('/resolve/main/')[1];
    requests.push({ path, authorization: new Headers(init?.headers).get('Authorization') });
    const blob = transport.files.get(path);
    return blob ? new Response(blob, { status: 200 }) : new Response('Missing file', { status: 404 });
  }));
});
afterEach(() => {
  for (const model of models.splice(0)) model.dispose();
  vi.unstubAllGlobals();
});

function createModel(): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [2], units: 2, activation: 'linear',
    kernelInitializer: 'ones', biasInitializer: 'zeros' }));
  models.push(model);
  const weights = [tf.tensor2d([1, -2, 3, 4], [2, 2]), tf.tensor1d([0.5, -0.5])];
  model.setWeights(weights); weights.forEach(weight => weight.dispose());
  return model;
}
function predict(model: tf.LayersModel): number[] {
  return tf.tidy(() => Array.from((model.predict(tf.tensor2d([[2, -1], [0, 3]])) as tf.Tensor).dataSync()));
}

describe('HuggingFaceProvider real TFJS transport', () => {
  it('reloads exactly the saved topology, named weights and fixed-observation inference', async () => {
    const model = createModel(), provider = new HuggingFaceProvider(config);
    await provider.save('roundtrip', model, { contract: 'fixture-v1' });
    const restored = await provider.load('roundtrip', 1, 0); models.push(restored);
    expect(restored.inputs[0].shape).toEqual([null, 2]);
    expect(restored.outputs[0].shape).toEqual([null, 2]);
    expect(restored.getWeights().map(weight => Array.from(weight.dataSync())))
      .toEqual([[1, -2, 3, 4], [0.5, -0.5]]);
    expect(predict(restored)).toEqual([-.5, -8.5, 9.5, 11.5]);
    expect(JSON.parse(await transport.files.get('roundtrip/metadata.json')!.text())).toEqual({ contract: 'fixture-v1' });
  });

  it('authenticates both topology and weight downloads', async () => {
    const provider = new HuggingFaceProvider(config);
    await provider.save('private', createModel());
    const restored = await provider.load('private', 1, 0); models.push(restored);
    expect(requests.map(request => request.path).sort()).toEqual(['private/model.json', 'private/weights.bin']);
    expect(requests.every(request => request.authorization === `Bearer ${config.token}`)).toBe(true);
  });

  it('rejects an unavailable checkpoint instead of constructing a replacement policy', async () => {
    await expect(new HuggingFaceProvider(config).load('missing', 1, 0)).rejects.toThrow(/404|Request|HTTP/i);
  });
});
