import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DQN_DEFAULTS,
  PPO_DEFAULTS,
  QTABLE_DEFAULTS,
} from '@ignitionai/backend-tfjs';
import {
  TRAIN_EPISODES,
  TRAIN_MAX_STEPS,
  TRAIN_SEEDS,
  assertNoStepsAfterStop,
  measureQTableVsRandom,
} from './examples/skill-train';

describe('ignition-train skill', () => {
  it('Q-table mean return exceeds random on declared GridWorld seeds', async () => {
    expect(TRAIN_SEEDS.length).toBeGreaterThanOrEqual(3);
    expect(TRAIN_EPISODES).toBeGreaterThan(0);
    expect(TRAIN_MAX_STEPS).toBeGreaterThan(0);

    const result = await measureQTableVsRandom();
    // eslint-disable-next-line no-console
    console.log('[ignition-train] declared budget', result.budget, 'seeds', result.seeds);
    // eslint-disable-next-line no-console
    console.log('[ignition-train] per-seed returns', JSON.stringify(result.perSeed, null, 2));
    // eslint-disable-next-line no-console
    console.log('[ignition-train] trainedMean', result.trainedMean, 'randomMean', result.randomMean);

    expect(result.trainedMean).toBeGreaterThan(result.randomMean);
  });

  it('records no automatic steps after stop() settles', async () => {
    const counts = await assertNoStepsAfterStop();
    // eslint-disable-next-line no-console
    console.log('[ignition-train] stop() step counts', counts);
    expect(counts.stepCountAfterSettle - counts.stepCountAtStop).toBeLessThanOrEqual(1);
    expect(counts.stepCountAfterWait).toBe(counts.stepCountAfterSettle);
  });

  it('env.train defaults match defaults.ts', () => {
    expect(DQN_DEFAULTS).toMatchObject({
      hiddenLayers: [64, 64],
      gamma: 0.99,
      epsilon: 1.0,
      epsilonDecay: 0.995,
      minEpsilon: 0.01,
      lr: 0.001,
      batchSize: 32,
      memorySize: 10000,
      targetUpdateFrequency: 100,
    });
    expect(PPO_DEFAULTS).toMatchObject({
      hiddenLayers: [64, 64],
      gamma: 0.99,
      gaeLambda: 0.95,
      clipRatio: 0.2,
      lr: 3e-4,
      epochs: 4,
      batchSize: 64,
      entropyCoef: 0.01,
      valueLossCoef: 0.5,
    });
    expect(QTABLE_DEFAULTS).toMatchObject({
      stateBins: 10,
      gamma: 0.99,
      epsilon: 1.0,
      epsilonDecay: 0.995,
      minEpsilon: 0.01,
      lr: 0.1,
    });
  });

  it('frontmatter is valid', () => {
    const skillPath = join(dirname(fileURLToPath(import.meta.url)), 'SKILL.md');
    const text = readFileSync(skillPath, 'utf8');
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    expect(match).not.toBeNull();
    const front = match![1];
    const body = match![2];
    const name = front.match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = front.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? '';
    expect(name).toBe('ignition-train');
    expect(description.length).toBeLessThanOrEqual(1024);
    expect(body.split('\n').length).toBeLessThanOrEqual(500);
  });
});
