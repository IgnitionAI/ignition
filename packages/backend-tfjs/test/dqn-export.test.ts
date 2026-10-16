import { expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src';

it('exports the current public DQN model with its trained predictions', async () => {
  await tf.setBackend('cpu');
  const agent = new DQNAgent({ inputSize: 2, actionSize: 2, hiddenLayers: [4], backend: 'cpu', batchSize: 1, memorySize: 2, seed: 12 });
  try {
    agent.remember({ state: [0.2, 0.4], action: 1, reward: 2, nextState: [0, 0], terminated: true, truncated: false });
    await agent.train();
    let saved: tf.io.ModelArtifacts | undefined;
    await agent.getModel().save(tf.io.withSaveHandler(async artifacts => {
      saved = artifacts;
      return { modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts) };
    }));
    if (!saved) throw new Error('No exported artifacts');
    const restored = await tf.loadLayersModel(tf.io.fromMemory(saved));
    try {
      const state = [0.2, 0.4];
      const exportedAction = tf.tidy(() => (restored.predict(tf.tensor2d([state])) as tf.Tensor).argMax(1).dataSync()[0]);
      expect(exportedAction).toBe(await agent.getAction(state, true));
      expect(restored.inputs[0].shape).toEqual([null, 2]);
      expect(restored.outputs[0].shape).toEqual([null, 2]);
    } finally { restored.dispose(); }
  } finally { agent.dispose(); }
});
