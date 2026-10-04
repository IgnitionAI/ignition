import * as tf from '@tensorflow/tfjs';
import { expect, it } from 'vitest';
import { SACAgent } from '../src';

it('updates genuine actor/twin critics and Polyak targets while greedy inference stays frozen', async () => {
  await tf.setBackend('cpu');
  const tensors = tf.memory().numTensors;
  const agent = new SACAgent({ inputSize: 2, actionSpace: { type: 'box', shape: [2], low: [-2, 0.1], high: [1, 3] },
    hiddenLayers: [4], batchSize: 2, memorySize: 4, warmup: 0, updateEvery: 1, seed: 11 });
  try {
    const before = agent.exportCheckpoint();
    for (let i = 0; i < 2; i++) {
      const state = [i * 0.1, 0.5];
      const action = await agent.getAction(state);
      expect(action[0]).toBeGreaterThanOrEqual(-2); expect(action[0]).toBeLessThanOrEqual(1);
      expect(action[1]).toBeGreaterThanOrEqual(0.1); expect(action[1]).toBeLessThanOrEqual(3);
      agent.remember({ state, action, reward: 1, nextState: [0, 0], terminated: i === 0, truncated: i !== 0 });
    }
    await agent.train();
    const trained = agent.exportCheckpoint();
    expect(trained.updates).toBe(1);
    for (let i = 0; i < 3; i++) expect(trained.networks[i]).not.toEqual(before.networks[i]);
    for (let target = 0; target < 2; target++) {
      const index = target + 3, critic = target + 1;
      trained.networks[index].forEach((weight, layer) => weight.values.forEach((value, j) => {
        expect(value).toBeCloseTo(before.networks[index][layer].values[j] * 0.995
          + trained.networks[critic][layer].values[j] * 0.005, 6);
      }));
    }
    await agent.getAction([0, 0], true);
    expect(agent.exportCheckpoint()).toEqual(trained);
    const after = tf.memory().numTensors;
    for (let i = 0; i < 5; i++) { await agent.train(); await agent.getAction([0, 0], true); }
    expect(tf.memory().numTensors).toBe(after);
  } finally { agent.dispose(); }
  expect(tf.memory().numTensors).toBe(tensors);
});

it('rejects unrepresentable float32 bounds before allocating networks', async () => {
  await tf.setBackend('cpu');
  const tensors = tf.memory().numTensors;
  expect(() => new SACAgent({ inputSize: 1, actionSpace: { type: 'box', shape: [1], low: [1e40], high: [2e40] } }))
    .toThrow(/float32/);
  expect(tf.memory().numTensors).toBe(tensors);
});

it('restores JSON checkpoints for identical inference and rejects corrupt weights atomically', async () => {
  await tf.setBackend('cpu');
  const config = { inputSize: 1, actionSpace: { type: 'box' as const, shape: [1], low: [-2], high: [1] },
    hiddenLayers: [4], batchSize: 1, memorySize: 2, warmup: 0, updateEvery: 1, seed: 29 };
  const source = new SACAgent(config), restored = new SACAgent(config);
  try {
    source.remember({ state: [0.2], action: [0], reward: 1, nextState: [0.3], terminated: false, truncated: true });
    await source.train();
    const serialized = JSON.parse(JSON.stringify(source.exportCheckpoint()));
    restored.loadCheckpoint(serialized);
    expect(await restored.getAction([0.2], true)).toEqual(await source.getAction([0.2], true));
    const before = restored.exportCheckpoint();
    serialized.networks[4][0].values.pop();
    expect(() => restored.loadCheckpoint(serialized)).toThrow(/weights/);
    expect(restored.exportCheckpoint()).toEqual(before);
    expect(() => restored.loadCheckpoint({ ...before, low: [-3] })).toThrow(/bounds/);
    expect(() => restored.loadCheckpoint({ ...before, version: 'old' })).toThrow();
    expect(restored.exportCheckpoint()).toEqual(before);
  } finally { source.dispose(); restored.dispose(); }
});

it.each([[true, false, 2], [false, true, 8]])('uses the smaller target critic and bootstraps truncation: terminal=%s', async (terminated, truncated, expectedLoss) => {
  await tf.setBackend('cpu');
  const agent = new SACAgent({ inputSize: 1, actionSpace: { type: 'box', shape: [1], low: [-1], high: [1] },
    hiddenLayers: [2], batchSize: 1, memorySize: 2, warmup: 0, updateEvery: 1, gamma: 0.5, alpha: 0 });
  try {
    const checkpoint = agent.exportCheckpoint();
    checkpoint.networks.forEach(network => network.forEach(weight => weight.values.fill(0)));
    checkpoint.networks[3].at(-1)!.values[0] = 2;
    checkpoint.networks[4].at(-1)!.values[0] = 4;
    agent.loadCheckpoint(checkpoint);
    agent.remember({ state: [0], action: [0], reward: 1, nextState: [0], terminated, truncated });
    await agent.train();
    expect(agent.getState().criticLoss).toBeCloseTo(expectedLoss, 6);
  } finally { agent.dispose(); }
});

it('accounts for Gaussian, tanh and per-dimension scale in the actor entropy loss', async () => {
  await tf.setBackend('cpu');
  const agent = new SACAgent({ inputSize: 1, actionSpace: { type: 'box', shape: [2], low: [-2, 0], high: [2, 8] },
    hiddenLayers: [2], batchSize: 256, memorySize: 256, warmup: 0, updateEvery: 1, gamma: 0, alpha: 0.2 });
  try {
    const checkpoint = agent.exportCheckpoint();
    checkpoint.networks.forEach(network => network.forEach(weight => weight.values.fill(0)));
    agent.loadCheckpoint(checkpoint);
    for (let i = 0; i < 256; i++) agent.remember({ state: [0], action: [0, 4], reward: 0,
      nextState: [0], terminated: true, truncated: false });
    await agent.train();
    // Independent quadrature of E[log Normal(X) - log(1-tanh(X)^2)] for X~N(0,1).
    const dx = 0.001;
    let expected = 0;
    for (let x = -8 + dx / 2; x < 8; x += dx) {
      const logGaussian = -0.5 * x * x - 0.5 * Math.log(2 * Math.PI);
      expected += (logGaussian - Math.log(1 - Math.tanh(x) ** 2)) * Math.exp(logGaussian) * dx;
    }
    expect(agent.getState().criticLoss).toBe(0);
    const trained = agent.exportCheckpoint();
    expect(trained.networks[1]).toEqual(checkpoint.networks[1]);
    expect(trained.networks[2]).toEqual(checkpoint.networks[2]);
    const expectedLoss = 0.2 * (2 * expected - Math.log(2) - Math.log(4));
    expect(Math.abs(agent.getState().actorLoss! - expectedLoss)).toBeLessThan(0.02);
  } finally { agent.dispose(); }
});
