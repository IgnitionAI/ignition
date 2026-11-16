import './skill-save-load-polyfill';

import { afterEach, describe, expect, it } from 'vitest';

import {
  LOCAL_STORAGE_META_PREFIX,
  SAVE_LOAD_CPU_BUDGET_MS,
  SAVE_LOAD_SEEDS,
  SAVE_LOAD_STEP_BUDGET,
  roundTripLocalCheckpoint,
  stepCheckpoint,
  versionedCheckpoint,
} from './skill-save-load';

describe('skill ignition-save-load', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('names checkpoints with version and step suffixes', () => {
    expect(versionedCheckpoint('cartpole-dqn', 3)).toBe('cartpole-dqn-v3');
    expect(stepCheckpoint('cartpole-dqn', 1000)).toBe('cartpole-dqn-step-1000');
  });

  it(
    'round-trips DQN weights and greedy actions through LocalStorageProvider, then restores epsilon via setState',
    async () => {
      // Budget and seeds declared before the measured loop (see constants).
      console.log(
        JSON.stringify({
          budget: {
            seeds: [...SAVE_LOAD_SEEDS],
            stepsPerSeed: SAVE_LOAD_STEP_BUDGET,
            cpuMs: SAVE_LOAD_CPU_BUDGET_MS,
            claimConvergence: false,
          },
        }),
      );
      const started = Date.now();
      const results = [];
      for (const seed of SAVE_LOAD_SEEDS) {
        const result = await roundTripLocalCheckpoint(seed);
        results.push(result);
        expect(result.uri).toBe(`localstorage://${result.modelId}`);
        expect(result.greedyAfter).toBe(result.greedyBefore);
        expect(result.weightMaxAbsDiff).toBe(0);
        expect(result.epsilonBeforeSave).toBeLessThan(1);
        expect(result.epsilonAfterSetState).toBe(result.epsilonBeforeSave);
        expect(result.trainStepCounterAfterSetState).toBe(result.trainStepCounterBeforeSave);
        expect(result.envStepCountBeforeSave).toBe(SAVE_LOAD_STEP_BUDGET);
        // Package gap: IgnitionEnv.load zeros stepCount and does not call setState.
        expect(result.envStepCountAfterLoad).toBe(0);
        expect(result.epsilonAfterLoadBeforeSetState).toBe(1);
        const meta = localStorage.getItem(`${LOCAL_STORAGE_META_PREFIX}${result.modelId}`);
        expect(meta).toBeTruthy();
      }
      const elapsedMs = Date.now() - started;
      console.log(JSON.stringify({ elapsedMs, results }, null, 2));
      expect(elapsedMs).toBeLessThan(SAVE_LOAD_CPU_BUDGET_MS);
    },
    SAVE_LOAD_CPU_BUDGET_MS,
  );
});
