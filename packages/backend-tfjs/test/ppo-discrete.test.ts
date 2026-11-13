import { afterEach, describe, expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { PPOAgent } from '../src/agents/ppo';

afterEach(() => {
  tf.disposeVariables();
});

describe('PPOAgent — discrete distribution', () => {
  it('returns a valid categorical distribution and a coherent log-prob', async () => {
    const agent = new PPOAgent({
      inputSize: 2,
      actionSize: 3,
      hiddenLayers: [8],
      seed: 11,
    });
    try {
      const state = [0.25, 0.75];
      const action = await agent.getAction(state);
      expect([0, 1, 2]).toContain(action);
      const probs = await agent.getActionProbs(state);
      expect(probs).toHaveLength(3);
      expect(probs.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 5);
      expect(probs.every((p) => p >= 0 && p <= 1)).toBe(true);
      const diag = agent.getLastActionDiagnostics();
      expect(diag.actionSpace).toBe('discrete');
      expect(typeof diag.action).toBe('number');
      expect(diag.logProb).toBeCloseTo(Math.log(Math.max(probs[action as number], 1e-8)), 5);
      expect(Number.isFinite(diag.value)).toBe(true);
    } finally {
      agent.dispose();
    }
  });

  it('defaults to discrete when actionSpace is omitted (public API)', async () => {
    const agent = new PPOAgent({ inputSize: 1, actionSize: 2, hiddenLayers: [4] });
    try {
      const action = await agent.getAction([0]);
      expect(typeof action).toBe('number');
    } finally {
      agent.dispose();
    }
  });
});
