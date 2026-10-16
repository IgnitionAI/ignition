import { expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { PPOAgent } from '../src/agents/ppo';
import type { ModelStorageProvider } from '@ignitionai/storage';

// A persisted policy with equal logits and a critic predicting V(s)=2.
function storage(): ModelStorageProvider {
  return {
    async load(id) {
      const net = tf.sequential();
      net.add(tf.layers.dense({ inputShape: [1], units: id.endsWith('/actor') ? 2 : 1,
        kernelInitializer: 'zeros', biasInitializer: tf.initializers.constant({ value: id.endsWith('/actor') ? 0 : 2 }) }));
      return net;
    },
    async save() { return 'memory'; }, async list() { return []; },
    async delete() {}, async exists() { return true; },
  };
}

it.each([
  { terminated: false, truncated: false, expected: 0 },
  { terminated: false, truncated: true, expected: 0 },
  { terminated: true, truncated: false, expected: 1 },
])('single-transition update bootstraps only nonterminal states: %j', async ({ terminated, truncated, expected }) => {
  const agent = new PPOAgent({ inputSize: 1, actionSize: 2, hiddenLayers: [8],
    gamma: 0.9, epochs: 1, entropyCoef: 0, storageProvider: storage() });
  try {
    await agent.load('fixture');
    const action = await agent.getAction([0], true); // tie chooses 0
    agent.remember({ state: [0], nextState: [0], action, reward: 0.5, terminated, truncated });
    // Nonterminal advantage: .5 + .9*2 - 2 = .3; terminal: .5 - 2 = -1.5.
    await agent.train();
    expect(await agent.getAction([0], true)).toBe(expected);
  } finally { agent.dispose(); }
});

it.each([false, true])('GAE does not carry rewards across an episode boundary (truncated=%s)', async (truncated) => {
  let firstValue = 0;
  const provider = storage();
  provider.load = async (id) => {
    const net = tf.sequential();
    net.add(tf.layers.dense({ inputShape: [2], units: id.endsWith('/actor') ? 2 : 1,
      useBias: false, kernelInitializer: tf.initializers.constant({ value: id.endsWith('/actor') ? 0 : 2 }) }));
    return net;
  };
  provider.save = async (id, model) => {
    if (id.endsWith('/critic')) firstValue = tf.tidy(() => (model.predict(tf.tensor2d([[1, 0]])) as tf.Tensor).dataSync()[0]);
    return 'memory';
  };
  const agent = new PPOAgent({ inputSize: 2, actionSize: 2, hiddenLayers: [8],
    gamma: 0.9, gaeLambda: 1, epochs: 1, batchSize: 2, storageProvider: provider });
  try {
    await agent.load('fixture');
    const action = await agent.getAction([1, 0], true);
    agent.remember({ state: [1, 0], nextState: [1, 0], action, reward: 3,
      terminated: !truncated, truncated });
    const nextAction = await agent.getAction([0, 1], true);
    agent.remember({ state: [0, 1], nextState: [0, 1], action: nextAction, reward: -100,
      terminated: true, truncated: false });
    await agent.train();
    await agent.save('result');
    // First target is 3 (terminal) or 4.8 (truncated), both above V=2.
    // Leaking the next episode's -100 reward would instead decrease it.
    expect(firstValue).toBeGreaterThan(2);
  } finally { agent.dispose(); }
});

it('bootstraps the actual successor rather than the current observation', async () => {
  const provider = storage();
  let probability = 0.5;
  provider.load = async (id) => {
    const net = tf.sequential();
    net.add(tf.layers.dense({ inputShape: [1], units: id.endsWith('/actor') ? 2 : 1,
      kernelInitializer: tf.initializers.constant({ value: id.endsWith('/actor') ? 0 : 2 }),
      biasInitializer: 'zeros' }));
    return net;
  };
  provider.save = async (id, model) => {
    if (id.endsWith('/actor')) probability = tf.tidy(() => tf.softmax(model.predict(tf.tensor2d([[0]])) as tf.Tensor).dataSync()[0]);
    return 'memory';
  };
  const agent = new PPOAgent({ inputSize: 1, actionSize: 2, hiddenLayers: [8], gamma: 0.9,
    epochs: 1, entropyCoef: 0, storageProvider: provider });
  try {
    await agent.load('fixture');
    const action = await agent.getAction([0], true);
    agent.remember({ state: [0], nextState: [1], action, reward: -0.5, terminated: false, truncated: false });
    await agent.train();
    await agent.save('result');
    // -.5 + .9*V(1) - V(0) = 1.3. Using V(0) gives -.5 instead.
    expect(probability).toBeGreaterThan(0.5);
  } finally { agent.dispose(); }
});
