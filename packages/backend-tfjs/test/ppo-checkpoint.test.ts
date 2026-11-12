import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as tf from '@tensorflow/tfjs';
import { PPOAgent } from '../src/agents/ppo';
import { fileSystemModelProvider } from './helpers/file-system-model-provider';

afterEach(() => {
  tf.disposeVariables();
});

describe('PPOAgent — checkpoint replay and dispose', () => {
  it('save → new instance → load yields identical greedy inference', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ppo-ckpt-'));
    const provider = fileSystemModelProvider(dir);
    const agent = new PPOAgent({
      inputSize: 2,
      actionSize: 3,
      hiddenLayers: [8],
      seed: 41,
      storageProvider: provider,
    });
    try {
      for (let i = 0; i < 6; i++) {
        const state = [i / 6, 1 - i / 6];
        const action = await agent.getAction(state);
        agent.remember({
          state,
          action,
          reward: 0.1,
          nextState: state,
          terminated: i === 5,
          truncated: false,
        });
      }
      await agent.train();
      const probe = [0.3, 0.7];
      const expected = await agent.getAction(probe, true);
      const expectedProbs = await agent.getActionProbs(probe);
      await agent.save('policy');
      const restored = new PPOAgent({
        inputSize: 2,
        actionSize: 3,
        hiddenLayers: [8],
        storageProvider: provider,
      });
      try {
        await restored.load('policy');
        expect(await restored.getAction(probe, true)).toBe(expected);
        const loadedProbs = await restored.getActionProbs(probe);
        for (let i = 0; i < expectedProbs.length; i++) {
          expect(loadedProbs[i]).toBeCloseTo(expectedProbs[i], 5);
        }
      } finally {
        restored.dispose();
      }
    } finally {
      agent.dispose();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('greedy inference does not mutate weights', async () => {
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [6],
      seed: 5,
    });
    try {
      const before = agent.getWeightFingerprint();
      for (let i = 0; i < 10; i++) {
        await agent.getAction([0.4], true);
      }
      expect(agent.getWeightFingerprint()).toEqual(before);
    } finally {
      agent.dispose();
    }
  });

  it('dispose releases tensors so a follow-up agent can allocate', async () => {
    const first = new PPOAgent({ inputSize: 1, actionSize: 2, hiddenLayers: [8] });
    await first.getAction([0]);
    first.dispose();
    const second = new PPOAgent({ inputSize: 1, actionSize: 2, hiddenLayers: [8] });
    try {
      const action = await second.getAction([0.2]);
      expect([0, 1]).toContain(action);
    } finally {
      second.dispose();
    }
  });

});
