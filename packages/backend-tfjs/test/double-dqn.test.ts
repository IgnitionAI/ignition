import { expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src/agents/dqn';
import type { ModelStorageProvider } from '@ignitionai/storage';

it.each([false, true])('separates online selection from target evaluation: doubleQ=%s', async doubleQ => {
  await tf.setBackend('cpu');
  const net = tf.sequential();
  net.add(tf.layers.dense({ inputShape: [1], units: 8, activation: 'relu', kernelInitializer: 'zeros' }));
  net.add(tf.layers.dense({ units: 2, kernelInitializer: 'zeros' }));
  net.compile({ optimizer: tf.train.sgd(0.1), loss: 'meanSquaredError' });
  const setBias = (bias: number[]) => tf.tidy(() => {
    const weights = net.getWeights();
    net.setWeights([...weights.slice(0, -1), tf.tensor1d(bias)]);
  });
  setBias([1, 4]);
  let learned = 0;
  let savedMetadata: Record<string, unknown> | undefined;
  const provider: ModelStorageProvider = {
    async load() { return net; },
    async save(_id, model, metadata) {
      learned = tf.tidy(() => (model.predict(tf.tensor2d([[0]])) as tf.Tensor).dataSync()[0]);
      savedMetadata = metadata;
      return 'memory';
    }, async list() { return []; }, async exists() { return true; }, async delete() {},
  };
  const agent = new DQNAgent({ inputSize: 1, actionSize: 2, hiddenLayers: [8], batchSize: 1,
    memorySize: 2, gamma: 1, backend: 'cpu', storageProvider: provider, doubleQ });
  try {
    await agent.load('fixture'); // target values [1,4]
    setBias([3, 2]); // online chooses action 0; target would choose action 1
    expect(await agent.getAction([0], true)).toBe(0);
    agent.remember({ state: [0], action: 0, nextState: [0], reward: 0, terminated: false, truncated: true });
    await agent.train();
    await agent.save('result');
    expect(learned).toBeCloseTo(doubleQ ? 2.8 : 3.1, 4);
    expect(savedMetadata?.algorithm).toBe(doubleQ ? 'double-dqn' : 'dqn');
  } finally { agent.dispose(); }
});
