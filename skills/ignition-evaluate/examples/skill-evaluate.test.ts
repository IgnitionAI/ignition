import { describe, expect, it } from 'vitest';
import { DQNAgent, setBackend } from '@ignitionai/backend-tfjs';
import {
  EVAL_BUDGET,
  EVAL_SEEDS,
  EPISODES_PER_SEED,
  POLICY_AGENT_SEED,
  TRAIN_SEEDS,
  evaluate,
  evaluateWithRandomBaseline,
  formatEvaluationReport,
  mean,
  sampleStd,
  seededCartPoleFactory,
  snapshotDqnWeights,
  summarizeReturns,
} from './skill-evaluate';

function makeFrozenDqn(): DQNAgent {
  return new DQNAgent({
    inputSize: 4,
    actionSize: 2,
    hiddenLayers: [8],
    backend: 'cpu',
    seed: POLICY_AGENT_SEED,
    epsilon: 1,
  });
}

describe('evaluation statistics (hand-calculated)', () => {
  it('matches mean, sample std, and 95% CI for [1, 2, 3]', () => {
    const values = [1, 2, 3];
    expect(mean(values)).toBe(2);
    expect(sampleStd(values)).toBe(1);
    const stats = summarizeReturns(values);
    const stderr = 1 / Math.sqrt(3);
    expect(stats.n).toBe(3);
    expect(stats.mean).toBe(2);
    expect(stats.sampleStd).toBe(1);
    expect(stats.stderr).toBeCloseTo(stderr, 12);
    expect(stats.ci95Low).toBeCloseTo(2 - 1.96 * stderr, 12);
    expect(stats.ci95High).toBeCloseTo(2 + 1.96 * stderr, 12);
  });
});

describe('evaluate() on CartPole', () => {
  it('declares disjoint train/eval seeds and a compute budget before running', () => {
    expect(TRAIN_SEEDS).toEqual([11, 29, 47]);
    expect(EVAL_SEEDS).toEqual([101, 202, 303]);
    for (const seed of EVAL_SEEDS) {
      expect(TRAIN_SEEDS).not.toContain(seed);
    }
    expect(EVAL_BUDGET.evalSeeds).toEqual(EVAL_SEEDS);
    expect(EVAL_BUDGET.episodesPerSeed).toBe(EPISODES_PER_SEED);
    expect(EVAL_BUDGET.maxEnvStepsPolicy).toBe(3 * 3 * 500);
  });

  it('repeats the same returns for the same eval seeds', async () => {
    await setBackend('cpu');
    const a = makeFrozenDqn();
    const b = makeFrozenDqn();
    try {
      const first = await evaluate(a, seededCartPoleFactory, EVAL_SEEDS, EPISODES_PER_SEED);
      const second = await evaluate(b, seededCartPoleFactory, EVAL_SEEDS, EPISODES_PER_SEED);
      expect(first.returns).toEqual(second.returns);
      expect(first.stats).toEqual(second.stats);
    } finally {
      a.dispose();
      b.dispose();
    }
  });

  it('leaves DQN weights and getState() unchanged after greedy evaluation', async () => {
    await setBackend('cpu');
    const agent = makeFrozenDqn();
    try {
      const weightsBefore = snapshotDqnWeights(agent);
      const stateBefore = agent.getState();
      await evaluate(agent, seededCartPoleFactory, EVAL_SEEDS, EPISODES_PER_SEED);
      expect(snapshotDqnWeights(agent)).toEqual(weightsBefore);
      expect(agent.getState()).toEqual(stateBefore);
    } finally {
      agent.dispose();
    }
  });

  it('includes a random-policy comparison in the report', async () => {
    await setBackend('cpu');
    const agent = makeFrozenDqn();
    try {
      const report = await evaluateWithRandomBaseline(
        agent,
        seededCartPoleFactory,
        EVAL_SEEDS,
        EPISODES_PER_SEED,
      );
      expect(report.randomBaseline).toBeDefined();
      expect(report.randomBaseline?.n).toBe(EVAL_SEEDS.length * EPISODES_PER_SEED);
      expect(typeof report.meanMinusRandom).toBe('number');
      // Raw measurement for the PR (no convergence claimed).
      console.log(formatEvaluationReport(report));
      const text = formatEvaluationReport(report);
      expect(text).toContain('Random baseline mean');
      expect(text).toContain('95% CI');
      expect(text).toContain('No convergence is claimed');
    } finally {
      agent.dispose();
    }
  });
});
