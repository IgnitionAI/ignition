import { expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src/agents/dqn';
import { IgnitionEnvTFJS } from '../src/ignition-env-tfjs';
import type { ModelStorageProvider } from '@ignitionai/storage';

it.each([{ runner: false, frequency: undefined }, { runner: true, frequency: undefined },
  { runner: false, frequency: 2 }, { runner: true, frequency: 2 }])('bootstraps from the refreshed target ($runner, $frequency)', async ({ runner, frequency }) => {
  const net = tf.sequential();
  net.add(tf.layers.dense({ inputShape: [1], units: 1, activation: 'relu', kernelInitializer: 'zeros', biasInitializer: 'zeros' }));
  net.add(tf.layers.dense({ units: 1, kernelInitializer: 'zeros', biasInitializer: 'zeros' }));
  net.compile({ optimizer: tf.train.sgd(0.1), loss: 'meanSquaredError' });
  const provider: ModelStorageProvider = {
    async load() { return net; }, async save() { return 'memory'; },
    async list() { return []; }, async exists() { return true; }, async delete() {},
  };
  const config = { inputSize: 1, actionSize: 1, hiddenLayers: [1], batchSize: 1, memorySize: 2,
    gamma: 1, storageProvider: provider, targetUpdateFrequency: frequency, backend: 'cpu' as const };
  const env = new IgnitionEnvTFJS({ actions: ['only'], observe: () => [0], step() {}, reward: () => 1, done: () => false, reset() {} });
  let agent: DQNAgent;
  if (runner) {
    env.train('dqn', config);
    env.stop();
    if (!(env.agent instanceof DQNAgent)) throw new Error('Expected DQN agent');
    agent = env.agent;
  } else {
    agent = new DQNAgent(config);
  }
  try {
    await agent.load('fixture');
    agent.remember({ state: [0], action: 0, nextState: [0], reward: 1, terminated: false, truncated: false });
    const cadence = frequency ?? 100;
    for (let update = 0; update < cadence; update++) await agent.train();
    const before = tf.tidy(() => (agent.getModel().predict(tf.tensor2d([[0]])) as tf.Tensor).dataSync()[0]);
    await agent.train();
    const after = tf.tidy(() => (agent.getModel().predict(tf.tensor2d([[0]])) as tf.Tensor).dataSync()[0]);
    // SGD takes a 0.2 step toward reward + newly synchronized target value.
    expect(after).toBeCloseTo(before + 0.2, 4);
  } finally { agent.dispose(); }
});
