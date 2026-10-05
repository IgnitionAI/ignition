import { expect, it, vi } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { IgnitionEnvTFJS } from '../src/ignition-env-tfjs';
import type { ModelStorageProvider } from '@ignitionai/storage';

it('trains and restores serialized Double DQN for greedy inference through IgnitionEnv', async () => {
  await tf.setBackend('cpu');
  let metadata: Record<string, unknown> | undefined;
  let saved: tf.Sequential | undefined;
  let artifacts: tf.io.ModelArtifacts | undefined;
  let restored: tf.LayersModel | undefined;
  const provider: ModelStorageProvider = {
    async save(_id, model, meta) {
      saved = model as tf.Sequential;
      metadata = meta;
      await model.save(tf.io.withSaveHandler(async value => {
        artifacts = value;
        return { modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(value) };
      }));
      return 'memory';
    },
    async load() {
      if (!artifacts) throw new Error('No saved model');
      restored = await tf.loadLayersModel(tf.io.fromMemory(artifacts));
      return restored;
    },
    async list() { return []; }, async exists() { return true; }, async delete() {},
  };
  let lastAction: number | undefined;
  const game = { actions: 2, observe: () => [0], step: (action: number) => { lastAction = action; },
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
    const expectedAction = await env.agent!.getAction([0], true);
    await env.load('double');
    expect(restored).not.toBe(saved);
    expect(restored!.getWeights().map(t => Array.from(t.dataSync()))).toEqual(before);
    await env.inferStep();
    expect(lastAction).toBe(expectedAction);
    expect(restored!.getWeights().map(t => Array.from(t.dataSync()))).toEqual(before);
  } finally { env.stop(); env.agent?.dispose?.(); }
});
