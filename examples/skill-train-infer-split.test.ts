import { describe, expect, it } from 'vitest';
import {
  TRAIN_INFER_SPLIT_BUDGET,
  runTrainInferSplit,
  type TrainInferSplitReport,
} from './skill-train-infer-split';

/**
 * Declared BEFORE any protocol run. This budget is a compute cap, not a
 * success criterion. No seed may claim CartPole convergence from these steps.
 */
const DECLARED_BUDGET = TRAIN_INFER_SPLIT_BUDGET;

describe('skill ignition-train-infer-split example', () => {
  it('prints the declared budget and seeds before measuring', () => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ declaredBudget: DECLARED_BUDGET }, null, 2));
    expect(DECLARED_BUDGET.seeds.length).toBeGreaterThanOrEqual(3);
    expect(DECLARED_BUDGET.inferSteps).toBeGreaterThan(0);
    expect(DECLARED_BUDGET.maxCpuMs).toBeLessThanOrEqual(60_000);
  });

  it(
    'keeps weights frozen across inferStep, reloads greedy actions, and disposes tensors',
    async () => {
      const started = Date.now();
      const reports: TrainInferSplitReport[] = [];

      for (const seed of DECLARED_BUDGET.seeds) {
        const report = await runTrainInferSplit(seed);
        reports.push(report);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(report));
        expect(report.weightsUnchangedAfterInfer).toBe(true);
        expect(report.greedyActionsMatchAfterReload).toBe(true);
        expect(report.tensorsAfterDispose).toBeLessThan(report.tensorsBeforeDispose);
        expect(report.greedyBefore).toEqual(report.greedyAfter);
      }

      const elapsedMs = Date.now() - started;
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ elapsedMs, seedCount: reports.length }));
      expect(elapsedMs).toBeLessThan(DECLARED_BUDGET.maxCpuMs);
    },
    TRAIN_INFER_SPLIT_BUDGET.maxCpuMs,
  );
});
