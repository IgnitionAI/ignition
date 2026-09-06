import { expect, it, vi } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { IgnitionEnvTFJS } from '../src/ignition-env-tfjs';
import type { ModelStorageProvider } from '@ignitionai/storage';

it('creates, trains, saves and greedily infers Double DQN through IgnitionEnv', async () => {
  await tf.setBackend('cpu');
  let metadata: Record<string, unknown> | undefined;
  let saved: tf.Sequential | undefined;
  const provider: ModelStorageProvider = {
    async save(_id, model, meta) { saved = model as tf.Sequential; metadata = meta; return 'memory'; },
    async load() { throw new Error('Not used'); },
    async list() { return []; }, async exists() { return true; }, async delete() {},
  };
  const game = { actions: 2, observe: () => [0], step: (_action: number) => {},
    reward: () => 1, done: () => true, reset: () => {} };
  const env = new IgnitionEnvTFJS(game);
  try {
    env.train('double-dqn', { backend: 'cpu', batchSize: 1, memorySize: 2, storageProvider: provider });
    env.stop();
    await env.step();
    await env.save('double', { algorithm: 'wrong-caller-label' });
    expect(metadata?.algorithm).toBe('double-dqn');
    expect(env.agent?.getState?.().trainStepCounter).toBe(1);
    const tensors = tf.memory().numTensors;
    const failedFit = vi.spyOn(saved!, 'fit').mockRejectedValueOnce(new Error('injected fit failure'));
    await expect(env.agent!.train()).rejects.toThrow('injected fit failure');
    expect(tf.memory().numTensors).toBe(tensors);
    failedFit.mockRestore();
    const before = saved!.getWeights().map(t => Array.from(t.dataSync()));
    await env.inferStep();
    expect(saved!.getWeights().map(t => Array.from(t.dataSync()))).toEqual(before);
  } finally { env.stop(); env.agent?.dispose?.(); }
});
