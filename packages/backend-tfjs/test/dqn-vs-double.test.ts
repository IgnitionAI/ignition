import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src/agents/dqn';
import { ALGOS, buildAgentConfig, probeStates, runTraining } from '../scripts/dqn-target-chasing.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const experiment = JSON.parse(
  readFileSync(join(repoRoot, 'packages/demo-target-chasing/dqn-vs-double-experiment.json'), 'utf8'),
);
const outRoot = join(repoRoot, 'packages/demo-target-chasing/public/dqn-vs-double');
const hasArtifacts = existsSync(join(outRoot, 'manifest.json'));
const readJsonl = (path: string) =>
  readFileSync(path, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

describe('DQN vs Double DQN: declared protocol', () => {
  it('declares the RL 1 seeds and both algorithms in a fixed order', () => {
    expect(experiment.seeds).toEqual([11, 29, 47]);
    expect(ALGOS).toEqual(['dqn', 'double-dqn']);
    expect(experiment.algorithms).toEqual(ALGOS);
    expect(Number.isInteger(experiment.budget.envStepsPerRun)).toBe(true);
  });

  it.each(experiment.seeds as number[])('only doubleQ differs between the two agent configs (seed %i)', (seed) => {
    const dqn = buildAgentConfig(experiment, 'dqn', seed);
    const dbl = buildAgentConfig(experiment, 'double-dqn', seed);
    expect(dqn.doubleQ).toBe(false);
    expect(dbl.doubleQ).toBe(true);
    const { doubleQ: _a, ...restDqn } = dqn;
    const { doubleQ: _b, ...restDbl } = dbl;
    expect(restDbl).toEqual(restDqn);
    expect(Object.keys(dbl).sort()).toEqual(Object.keys(dqn).sort());
  });

  it('uses one fixed probe set of start states', () => {
    const starts = probeStates(experiment);
    expect(starts).toHaveLength(experiment.overestimation.probeStarts.count);
    expect(starts[0]).toBe(experiment.overestimation.probeStarts.min);
    expect(starts.at(-1)).toBeCloseTo(experiment.overestimation.probeStarts.max, 12);
  });
});

describe('DQN vs Double DQN: short runs', () => {
  const envSteps = 800;
  const short = async (algo: string, seed: number) => {
    await tf.setBackend('cpu');
    return runTraining({ AgentClass: DQNAgent, experiment, algo, seed, envSteps });
  };

  it.each(ALGOS)('replays the same start of training with the same seed (%s)', async (algo) => {
    const a = await short(algo, 11);
    const b = await short(algo, 11);
    expect(a.episodes).toEqual(b.episodes);
    expect(a.qVsReturn).toEqual(b.qVsReturn);
    expect(a.summary).toEqual(b.summary);
  }, 60_000);

  it('spends exactly the same env-step budget for both algorithms', async () => {
    const [dqn, dbl] = [await short('dqn', 29), await short('double-dqn', 29)];
    for (const run of [dqn, dbl]) {
      expect(run.summary.envSteps).toBe(envSteps);
      expect(run.summary.trainSteps).toBe(envSteps - experiment.budget.learningStarts);
      const lastLogged = run.episodes.at(-1)!.globalStep;
      expect(lastLogged + (run.summary.partialEpisodeAtBudget?.steps ?? 0)).toBe(envSteps);
      expect(run.qVsReturn[0].step).toBe(0);
      expect(run.qVsReturn.at(-1)!.step).toBe(envSteps);
    }
    expect(dqn.summary.doubleQ).toBe(false);
    expect(dbl.summary.doubleQ).toBe(true);
  }, 60_000);
});

describe.skipIf(!hasArtifacts)('DQN vs Double DQN: committed artifacts', () => {
  const manifest = hasArtifacts ? JSON.parse(readFileSync(join(outRoot, 'manifest.json'), 'utf8')) : null;
  const cases = ALGOS.flatMap((algo) => (experiment.seeds as number[]).map((seed) => [algo, seed] as const));

  it('lists every artifact with a matching sha256', () => {
    const entries = [manifest.experiment, ...Object.values(manifest.runs).flatMap((bySeed: any) =>
      Object.values(bySeed).flatMap((files: any) => Object.values(files)))] as { path: string; sha256: string; bytes: number }[];
    expect(entries.length).toBe(1 + cases.length * 11);
    for (const entry of entries) {
      const buf = readFileSync(join(outRoot, entry.path));
      expect(buf.byteLength, entry.path).toBe(entry.bytes);
      expect(createHash('sha256').update(buf).digest('hex'), entry.path).toBe(entry.sha256);
    }
  });

  it.each(cases)('%s seed %i: logs have the expected shape and the declared budget', (algo, seed) => {
    const dir = join(outRoot, algo, `seed-${seed}`);
    const budget = experiment.budget.envStepsPerRun;
    const episodes = readJsonl(join(dir, 'episodes.jsonl'));
    let prev = 0;
    episodes.forEach((row, i) => {
      expect(row).toMatchObject({ algo, seed, episode: i + 1 });
      expect(typeof row.return).toBe('number');
      expect(row.steps).toBeGreaterThan(0);
      expect(row.success).toBe(row.terminated);
      expect(row.globalStep).toBe(prev + row.steps);
      prev = row.globalStep;
    });
    const summary = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8'));
    expect(summary.envSteps).toBe(budget);
    expect(prev + (summary.partialEpisodeAtBudget?.steps ?? 0)).toBe(budget);

    const q = readJsonl(join(dir, 'q-vs-return.jsonl'));
    const starts = probeStates(experiment);
    expect(q[0].step).toBe(0);
    expect(q.at(-1).step).toBe(budget);
    for (const row of q) {
      expect(row).toMatchObject({ algo, seed });
      for (const k of ['meanQMax', 'meanDiscountedReturn', 'meanGap']) expect(Number.isFinite(row[k]), k).toBe(true);
      expect(row.meanGap).toBeCloseTo(row.meanQMax - row.meanDiscountedReturn, 9);
      expect(row.probes.map((p: { start: number }) => p.start)).toEqual(starts);
    }

    const run = JSON.parse(readFileSync(join(dir, 'run.json'), 'utf8'));
    expect(run.agentConfig).toEqual(buildAgentConfig(experiment, algo, seed));
    expect(run.durationMs).toBeGreaterThan(0);
    const evalNew = JSON.parse(readFileSync(join(dir, 'eval-new-process.json'), 'utf8'));
    expect(evalNew.identicalGreedyAction).toBe(true);
  });

  it.each(ALGOS)('a fresh short run replays the first committed episodes (%s, seed 11)', async (algo) => {
    await tf.setBackend('cpu');
    const fresh = await runTraining({ AgentClass: DQNAgent, experiment, algo, seed: 11, envSteps: 800 });
    const committed = readJsonl(join(outRoot, algo, 'seed-11', 'episodes.jsonl')).slice(0, fresh.episodes.length);
    expect(fresh.episodes).toEqual(committed);
  }, 60_000);
});
