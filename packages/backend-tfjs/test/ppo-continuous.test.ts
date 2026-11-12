import { afterEach, describe, expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { PPOAgent } from '../src/agents/ppo';

afterEach(() => {
  tf.disposeVariables();
});

describe('PPOAgent — continuous actions', () => {
  it('samples a 1-D action inside configured bounds', async () => {
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 1,
      actionSpace: 'continuous',
      actionLow: [-1.5],
      actionHigh: [0.5],
      hiddenLayers: [8],
      seed: 21,
    });
    try {
      for (let i = 0; i < 20; i++) {
        const action = await agent.getAction([0]);
        expect(Array.isArray(action)).toBe(true);
        expect((action as number[]).length).toBe(1);
        expect((action as number[])[0]).toBeGreaterThanOrEqual(-1.5);
        expect((action as number[])[0]).toBeLessThanOrEqual(0.5);
      }
      const greedy = await agent.getAction([0], true);
      expect((greedy as number[])[0]).toBeGreaterThanOrEqual(-1.5);
      expect((greedy as number[])[0]).toBeLessThanOrEqual(0.5);
      await agent.getAction([0]);
      const diag = agent.getLastActionDiagnostics();
      expect(diag.actionSpace).toBe('continuous');
      expect(diag.preTanh).toHaveLength(1);
      expect(diag.mean).toHaveLength(1);
      expect(diag.logStd).toHaveLength(1);
      const u = diag.preTanh![0];
      const mu = diag.mean![0];
      const logStd = diag.logStd![0];
      const z = (u - mu) / Math.exp(logStd);
      const gaussian = -0.5 * (z * z + 2 * logStd + Math.log(2 * Math.PI));
      const squashed = Math.tanh(u);
      const tanhCorrection = Math.log(Math.max(1 - squashed * squashed, 1e-6));
      expect(diag.logProb).toBeCloseTo(gaussian - tanhCorrection, 6);
    } finally {
      agent.dispose();
    }
  });

  it('learns a deterministic 1-D control task (push toward +1)', async () => {
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 1,
      actionSpace: 'continuous',
      actionLow: [-1],
      actionHigh: [1],
      hiddenLayers: [16, 16],
      lr: 0.01,
      epochs: 4,
      batchSize: 16,
      entropyCoef: 0.001,
      gamma: 0.99,
      gaeLambda: 0.95,
      seed: 29,
      rolloutSize: 32,
    });
    try {
      const initial = (await agent.getAction([0], true)) as number[];
      for (let ep = 0; ep < 40; ep++) {
        let pos = -0.8;
        for (let step = 0; step < 16; step++) {
          const state = [pos];
          const action = (await agent.getAction(state)) as number[];
          const next = Math.max(-1, Math.min(1, pos + 0.2 * action[0]));
          const reward = -Math.abs(next - 1);
          const terminated = Math.abs(next - 1) < 0.05;
          agent.remember({
            state,
            action,
            reward,
            nextState: [next],
            terminated,
            truncated: step === 15 && !terminated,
          });
          pos = next;
          if (terminated) break;
        }
        await agent.train();
      }
      const greedy = (await agent.getAction([-0.8], true)) as number[];
      expect(greedy[0]).toBeGreaterThan(initial[0]);
      expect(greedy[0]).toBeGreaterThan(0);
    } finally {
      agent.dispose();
    }
  }, 60_000);
});
