import { expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src/agents/dqn';
import type { ModelStorageProvider } from '@ignitionai/storage';

it.each([false, true])('DQN bootstraps unless terminated=%s', async (terminated) => {
  await tf.setBackend('cpu');
  const net = tf.sequential();
  net.add(tf.layers.dense({ inputShape: [1], units: 8, activation: 'relu', kernelInitializer: 'zeros' }));
  net.add(tf.layers.dense({ units: 2, kernelInitializer: 'zeros',
    biasInitializer: tf.initializers.constant({ value: 2 }) }));
  net.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
  let learned = 0;
  const provider: ModelStorageProvider = {
    async load() { return net; },
    async save(_id, model) {
      learned = tf.tidy(() => (model.predict(tf.tensor2d([[0]])) as tf.Tensor).dataSync()[0]);
      return 'memory';
    }, async list() { return []; }, async exists() { return true; }, async delete() {},
  };
  const agent = new DQNAgent({ inputSize: 1, actionSize: 2, hiddenLayers: [8], batchSize: 1,
    memorySize: 2, gamma: 0.9, backend: 'cpu', storageProvider: provider });
  try {
    await agent.load('fixture');
    agent.remember({ state: [0], action: 0, nextState: [0], reward: 0.5, terminated, truncated: !terminated });
    await agent.train();
    await agent.save('result');
    if (terminated) expect(learned).toBeLessThan(2);
    else expect(learned).toBeGreaterThan(2);
  } finally { agent.dispose(); }
});
