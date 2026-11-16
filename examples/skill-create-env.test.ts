import { describe, expect, it } from 'vitest';
import { IgnitionEnv, validateTrainingEnv } from '@ignitionai/core';
import { CartPoleEnv, GridWorldEnv, MountainCarEnv } from '@ignitionai/environments';
import {
  TRAINING_BUDGET_STEPS,
  TRAINING_SEEDS,
  createInvalidTrainingEnv,
  LineWorldEnv,
  runLineWorldTraining,
  scriptedStep,
  spaceKind,
} from './skill-create-env';

/**
 * Budget and seeds declared before execution:
 * - budget = TRAINING_BUDGET_STEPS (200 env steps / seed)
 * - seeds = TRAINING_SEEDS (7, 11, 19)
 * Measurements are printed; this file does not assert convergence.
 */
describe('skill-create-env LineWorld', () => {
  it('passes TrainingEnv validation and wraps in IgnitionEnv', () => {
    const world = new LineWorldEnv();
    expect(() => validateTrainingEnv(world)).not.toThrow();
    expect(() => new IgnitionEnv(world)).not.toThrow();
    expect(spaceKind(world.actionSpace())).toBe('discrete n=2');
    expect(spaceKind(world.observationSpace())).toBe('box shape=1');
    expect(world.observe()).toEqual([0]);
  });

  it('rejects an invalid env with the real validation error', () => {
    const invalid = createInvalidTrainingEnv();
    expect(() => validateTrainingEnv(invalid)).toThrowError(
      '[IgnitionAI] TrainingEnv must implement done() as a function',
    );
    expect(
      () => new IgnitionEnv(invalid as never),
    ).toThrowError('[IgnitionAI] TrainingEnv must implement done() as a function');
  });

  it('reports terminated when the 1D goal is reached', async () => {
    const world = new LineWorldEnv(3, 20);
    world.position = 1;
    const result = await scriptedStep(world);
    expect(result).toMatchObject({
      observation: [1],
      reward: 1,
      terminated: true,
      truncated: false,
    });
    expect(world.position).toBe(0);
  });

  it('reports truncated when the step limit hits before the goal', async () => {
    const world = new LineWorldEnv(5, 1);
    const result = await scriptedStep(world);
    expect(result.terminated).toBe(false);
    expect(result.truncated).toBe(true);
    expect(result.reward).toBe(-0.01);
    expect(world.position).toBe(0);
  });

  it('runs the declared qtable budget on three seeds and records raw returns', async () => {
    expect(TRAINING_SEEDS).toHaveLength(3);
    const measurements = [];
    for (const seed of TRAINING_SEEDS) {
      const measurement = await runLineWorldTraining(seed, TRAINING_BUDGET_STEPS);
      measurements.push(measurement);
      expect(measurement.completedSteps).toBe(TRAINING_BUDGET_STEPS);
      expect(measurement.terminatedEpisodes + measurement.truncatedEpisodes).toBe(
        measurement.episodeReturns.length,
      );
    }
    // Raw measurements (failures included). Not a convergence claim.
    console.log(JSON.stringify({ budgetSteps: TRAINING_BUDGET_STEPS, measurements }, null, 2));
  });

  it('reference envs still satisfy TrainingEnv validation', () => {
    expect(() => validateTrainingEnv(new GridWorldEnv())).not.toThrow();
    expect(() => validateTrainingEnv(new CartPoleEnv())).not.toThrow();
    expect(() => validateTrainingEnv(new MountainCarEnv())).not.toThrow();
  });
});
