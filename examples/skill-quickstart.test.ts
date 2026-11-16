import { describe, expect, it } from 'vitest';
import {
  QUICKSTART_BUDGET,
  QUICKSTART_SEEDS,
  proveStopHaltsAutomaticLoop,
  runQuickstartBudget,
} from './skill-quickstart';

describe('skill-quickstart CartPole loop', () => {
  it('declares budget and at least three seeds before any run', () => {
    expect(QUICKSTART_SEEDS).toEqual([11, 29, 47]);
    expect(QUICKSTART_BUDGET.transitionsPerSeed).toBe(8);
    expect(QUICKSTART_BUDGET.backend).toBe('cpu');
  });

  it.each([...QUICKSTART_SEEDS])(
    'runs the declared budget on seed %i without claiming convergence',
    async (seed) => {
      const snapshot = await runQuickstartBudget(seed);
      console.log(`QUICKSTART_RAW ${JSON.stringify(snapshot)}`);
      expect(snapshot.seed).toBe(seed);
      expect(snapshot.stepCount).toBe(QUICKSTART_BUDGET.transitionsPerSeed);
      expect(snapshot.rewards).toHaveLength(QUICKSTART_BUDGET.transitionsPerSeed);
      expect(snapshot.rewards.every((reward) => Number.isFinite(reward))).toBe(true);
      expect(snapshot.observationSize).toBe(4);
      expect(snapshot.lastError).toBeNull();
    },
  );

  it('stop() cancels further automatic ticks', async () => {
    const proof = await proveStopHaltsAutomaticLoop(QUICKSTART_SEEDS[0]);
    console.log(`QUICKSTART_STOP_RAW ${JSON.stringify(proof)}`);
    expect(proof.afterStop).toBeGreaterThanOrEqual(1);
    expect(proof.later - proof.afterStop).toBeLessThanOrEqual(1);
    expect(proof.lastError).toBeNull();
  });
});
