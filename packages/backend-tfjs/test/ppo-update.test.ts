import { afterEach, describe, expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { clipSurrogate, PPOAgent } from '../src/agents/ppo';

afterEach(() => {
  tf.disposeVariables();
});

describe('clipSurrogate', () => {
  it('leaves an unclipped positive-advantage ratio unchanged', () => {
    expect(clipSurrogate(1.05, 2, 0.2)).toBeCloseTo(2.1, 10);
  });

  it('clips a large ratio when the advantage is positive', () => {
    // r=2, clip to 1.2, A>0 → min(2A, 1.2A) = 1.2A
    expect(clipSurrogate(2, 3, 0.2)).toBeCloseTo(3.6, 10);
  });

  it('clips a small ratio when the advantage is negative', () => {
    // r=0.1, clip to 0.8, A<0 → min(0.1A, 0.8A) = 0.8A (less negative is larger)
    expect(clipSurrogate(0.1, -2, 0.2)).toBeCloseTo(-1.6, 10);
  });
});

describe('PPOAgent — mini-batch updates', () => {
  it('keeps a non-zero policy signal on a small batch of more than one transition', async () => {
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [8],
      lr: 0.05,
      epochs: 4,
      batchSize: 4,
      entropyCoef: 0,
      valueLossCoef: 0.5,
      gamma: 0.99,
      seed: 7,
    });
    try {
      const before = await agent.getActionProbs([0]);
      for (let i = 0; i < 8; i++) {
        await agent.getAction([0], true);
        agent.remember({
          state: [0],
          action: 1,
          reward: 1,
          nextState: [0],
          terminated: true,
          truncated: false,
        });
      }
      await agent.train();
      const after = await agent.getActionProbs([0]);
      expect(after.every((p) => Number.isFinite(p))).toBe(true);
      expect(after.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 5);
      expect(after[1]).toBeGreaterThan(before[1]);
      const stats = agent.getLastUpdateStats();
      expect(stats).not.toBeNull();
      expect(Number.isFinite(stats!.actorLoss)).toBe(true);
      expect(Number.isFinite(stats!.criticLoss)).toBe(true);
      expect(Number.isFinite(stats!.entropy)).toBe(true);
      expect(Number.isFinite(stats!.meanRatio)).toBe(true);
      expect(stats!.entropy).toBeGreaterThanOrEqual(0);
    } finally {
      agent.dispose();
    }
  });

  it('handles mini-batches of size 1 without NaN', async () => {
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [4],
      lr: 1e-3,
      epochs: 2,
      batchSize: 1,
      entropyCoef: 0.01,
      seed: 3,
    });
    try {
      for (let i = 0; i < 3; i++) {
        const action = await agent.getAction([0.2 * i]);
        agent.remember({
          state: [0.2 * i],
          action,
          reward: i === 1 ? 1 : 0,
          nextState: [0.2 * i],
          terminated: i === 2,
          truncated: false,
        });
      }
      await agent.train();
      const probs = await agent.getActionProbs([0]);
      expect(probs.every((p) => Number.isFinite(p) && p >= 0 && p <= 1)).toBe(true);
      const stats = agent.getLastUpdateStats();
      expect(stats).not.toBeNull();
      expect(Number.isNaN(stats!.actorLoss)).toBe(false);
      expect(Number.isNaN(stats!.criticLoss)).toBe(false);
      expect(Number.isNaN(stats!.meanRatio)).toBe(false);
    } finally {
      agent.dispose();
    }
  });
});
