import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src/agents/dqn';
import {
  ALGOS,
  VARIANTS,
  buildAgentConfig,
  probeStates,
  rewardNoiseOf,
  rewardNoiseStream,
  runTraining,
} from '../scripts/dqn-target-chasing.mjs';
import { nav1dStep } from '../scripts/nav1d.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const readJson = (rel: string) => JSON.parse(readFileSync(join(repoRoot, rel), 'utf8'));
const control = readJson(VARIANTS.control.experimentPath);
const noisy = readJson(VARIANTS.noisy.experimentPath);
const outRoot = join(repoRoot, VARIANTS.noisy.outDir);
const hasArtifacts = existsSync(join(outRoot, 'manifest.json'));
const readJsonl = (path: string) =>
  readFileSync(path, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

const NOISY_EPISODE_KEYS = ['noisyReturn'];
const NOISY_Q_KEYS = ['meanDiscountedNoisyReturn'];
const stripEpisode = (row: Record<string, unknown>) => {
  const out = { ...row };
  for (const k of NOISY_EPISODE_KEYS) delete out[k];
  return out;
};
const stripQ = (row: any) => {
  const out = { ...row, probes: row.probes.map(({ discountedNoisyReturn: _n, ...p }: any) => p) };
  for (const k of NOISY_Q_KEYS) delete out[k];
  return out;
};
const stripSummary = (s: any) => {
  const { rewardNoise: _r, lastMeanNoisyReturn: _l, ...rest } = s;
  const { meanDiscountedNoisyReturn: _m, ...finalQ } = rest.finalQVsReturn;
  const partial = rest.partialEpisodeAtBudget ? stripEpisode(rest.partialEpisodeAtBudget) : rest.partialEpisodeAtBudget;
  return { ...rest, finalQVsReturn: finalQ, partialEpisodeAtBudget: partial };
};

describe('noisy reward: declared protocol', () => {
  it('declares one zero-mean gaussian noise with a single sigma', () => {
    expect(control.rewardNoise).toBeUndefined();
    expect(rewardNoiseOf(control)).toBeNull();
    expect(rewardNoiseOf(noisy)).toEqual({ distribution: 'gaussian', mean: 0, sigma: noisy.rewardNoise.sigma });
    expect(noisy.rewardNoise.sigma).toBeGreaterThan(0);
    expect(typeof noisy.rewardNoise.sigmaJustification).toBe('string');
  });

  it('copies everything else from the control experiment', () => {
    for (const key of ['task', 'algorithms', 'onlyDifference', 'seeds', 'agent', 'order']) {
      expect(noisy[key], key).toEqual(control[key]);
    }
    const { choice: _a, ...budget } = noisy.budget;
    const { choice: _b, ...controlBudget } = control.budget;
    expect(budget).toEqual(controlBudget);
    for (const key of ['file', 'everyEnvSteps', 'probeStarts', 'estimated', 'reference']) {
      expect(noisy.overestimation[key], key).toEqual(control.overestimation[key]);
    }
    for (const key of ['greedyEpisodes', 'starts', 'checkpoint', 'replay']) {
      expect(noisy.eval[key], key).toEqual(control.eval[key]);
    }
    expect(noisy.summary.lastEpisodes).toBe(control.summary.lastEpisodes);
  });

  it.each(noisy.seeds as number[])('builds the same agent configs as the control (seed %i)', (seed) => {
    for (const algo of ALGOS) expect(buildAgentConfig(noisy, algo, seed)).toEqual(buildAgentConfig(control, algo, seed));
  });

  it('rejects an invalid noise declaration', () => {
    expect(() => rewardNoiseOf({ rewardNoise: { distribution: 'uniform', mean: 0, sigma: 1 } })).toThrow();
    expect(() => rewardNoiseOf({ rewardNoise: { distribution: 'gaussian', mean: 0, sigma: -1 } })).toThrow();
  });

  it('justifies sigma from the reward scale of the task (optimal policy, uniform starts)', () => {
    // Pooled per-step true reward of the optimal policy over starts uniform[0, 0.4].
    let n = 0;
    let s = 0;
    let s2 = 0;
    const grid = 40_000;
    for (let i = 0; i < grid; i++) {
      let p = ((i + 0.5) / grid) * 0.4;
      for (let k = 0; k < control.budget.maxStepsPerEpisode; k++) {
        const r = nav1dStep(p, 1);
        n += 1;
        s += r.reward;
        s2 += r.reward * r.reward;
        p = r.newPos;
        if (r.done) break;
      }
    }
    const m = s / n;
    const std = Math.sqrt(s2 / n - m * m);
    expect(n / grid).toBeCloseTo(3.875, 3);
    expect(std).toBeCloseTo(0.459, 3);
    expect(noisy.rewardNoise.sigma).toBe(Math.ceil(std * 10) / 10);
  });
});

describe('noisy reward: noise stream', () => {
  it('is deterministic per seed and differs between seeds', () => {
    const a = rewardNoiseStream(11);
    const b = rewardNoiseStream(11);
    const c = rewardNoiseStream(29);
    const xa = Array.from({ length: 50 }, () => a());
    expect(Array.from({ length: 50 }, () => b())).toEqual(xa);
    expect(Array.from({ length: 50 }, () => c())).not.toEqual(xa);
  });

  it.each(noisy.seeds as number[])('is close to a standard normal over one run budget (seed %i)', (seed) => {
    const z = rewardNoiseStream(seed);
    const n = noisy.budget.envStepsPerRun;
    let s = 0;
    let s2 = 0;
    for (let i = 0; i < n; i++) {
      const v = z();
      expect(Number.isFinite(v)).toBe(true);
      s += v;
      s2 += v * v;
    }
    const m = s / n;
    // 4 standard errors for the mean (1/sqrt(n)) and for the variance (sqrt(2/n)).
    expect(Math.abs(m)).toBeLessThan(4 / Math.sqrt(n));
    expect(Math.abs(s2 / n - m * m - 1)).toBeLessThan(4 * Math.sqrt(2 / n));
  });
});

describe('noisy reward: sigma 0 and no noise reproduce the control', () => {
  const envSteps = 800;
  const sigmaZero = { ...noisy, rewardNoise: { ...noisy.rewardNoise, sigma: 0 } };
  const run = async (experiment: unknown, algo: string, seed: number) => {
    await tf.setBackend('cpu');
    return runTraining({ AgentClass: DQNAgent, experiment, algo, seed, envSteps });
  };

  it.each(ALGOS)('without rewardNoise the output is the control output (%s, seed 11)', async (algo) => {
    const { rewardNoise: _r, ...noNoise } = noisy;
    const [a, b] = [await run(control, algo, 11), await run(noNoise, algo, 11)];
    expect(b.episodes).toEqual(a.episodes);
    expect(b.qVsReturn).toEqual(a.qVsReturn);
    expect(b.summary).toEqual(a.summary);
    expect(a.episodes[0]).not.toHaveProperty('noisyReturn');
  }, 60_000);

  it.each(ALGOS)('sigma 0 reproduces the control exactly on 800 steps (%s, seed 29)', async (algo) => {
    const [a, b] = [await run(control, algo, 29), await run(sigmaZero, algo, 29)];
    expect(b.episodes.map(stripEpisode)).toEqual(a.episodes);
    expect(b.qVsReturn.map(stripQ)).toEqual(a.qVsReturn);
    expect(stripSummary(b.summary)).toEqual(a.summary);
    for (const row of b.episodes) expect(row.noisyReturn).toBe(row.return);
    for (const row of b.qVsReturn) expect(row.meanDiscountedNoisyReturn).toBe(row.meanDiscountedReturn);
    expect(b.summary.rewardNoise.draws).toBe(envSteps);
    expect(b.summary.rewardNoise.sumSq).toBe(0);
  }, 60_000);
});

describe('noisy reward: short noisy runs', () => {
  const envSteps = 800;
  const run = async (algo: string, seed: number) => {
    await tf.setBackend('cpu');
    return runTraining({ AgentClass: DQNAgent, experiment: noisy, algo, seed, envSteps });
  };
  const trueReturns = new Set(
    Array.from({ length: control.budget.maxStepsPerEpisode }, (_, k) => [
      +(1 - 0.05 * k).toFixed(10),
      +(-0.05 * (k + 1)).toFixed(10),
    ]).flat(),
  );

  it('replays the same noisy run with the same seed (dqn)', async () => {
    const [a, b] = [await run('dqn', 11), await run('dqn', 11)];
    expect(a.episodes).toEqual(b.episodes);
    expect(a.qVsReturn).toEqual(b.qVsReturn);
    expect(a.summary).toEqual(b.summary);
  }, 60_000);

  it('feeds the same noise sequence to both algorithms at equal seed, logs true and noisy returns', async () => {
    const [dqn, dbl] = [await run('dqn', 47), await run('double-dqn', 47)];
    expect(dbl.summary.rewardNoise).toEqual(dqn.summary.rewardNoise);
    expect(dqn.summary.rewardNoise.draws).toBe(envSteps);
    for (const r of [dqn, dbl]) {
      expect(r.summary.envSteps).toBe(envSteps);
      expect(r.summary.trainSteps).toBe(envSteps - control.budget.learningStarts);
      for (const row of r.episodes) {
        expect(trueReturns.has(+row.return.toFixed(10)), String(row.return)).toBe(true);
        expect(row.noisyReturn).not.toBe(row.return);
      }
      for (const row of r.qVsReturn) {
        expect(Number.isFinite(row.meanDiscountedNoisyReturn)).toBe(true);
        expect(row.meanGap).toBeCloseTo(row.meanQMax - row.meanDiscountedReturn, 9);
      }
    }
    // Probe noise depends on (seed, checkpoint, probe) only: identical at step 0 (same untrained greedy rollouts).
    expect(dbl.qVsReturn[0].meanDiscountedNoisyReturn).toBe(dqn.qVsReturn[0].meanDiscountedNoisyReturn);
  }, 60_000);
});

describe.skipIf(!hasArtifacts)('noisy reward: committed artifacts', () => {
  const manifest = hasArtifacts ? JSON.parse(readFileSync(join(outRoot, 'manifest.json'), 'utf8')) : null;
  const cases = ALGOS.flatMap((algo) => (noisy.seeds as number[]).map((seed) => [algo, seed] as const));

  it('lists every artifact with a matching sha256', () => {
    const entries = [manifest.experiment, ...Object.values(manifest.runs).flatMap((bySeed: any) =>
      Object.values(bySeed).flatMap((files: any) => Object.values(files)))] as { path: string; sha256: string; bytes: number }[];
    expect(entries.length).toBe(1 + cases.length * 11);
    for (const entry of entries) {
      const buf = readFileSync(join(outRoot, entry.path));
      expect(buf.byteLength, entry.path).toBe(entry.bytes);
      expect(createHash('sha256').update(buf).digest('hex'), entry.path).toBe(entry.sha256);
    }
    expect(manifest.rewardNoise).toEqual(noisy.rewardNoise);
  });

  it.each(cases)('%s seed %i: logs have the expected shape, the declared budget and the noise', (algo, seed) => {
    const dir = join(outRoot, algo, `seed-${seed}`);
    const budget = noisy.budget.envStepsPerRun;
    const episodes = readJsonl(join(dir, 'episodes.jsonl'));
    let prev = 0;
    episodes.forEach((row, i) => {
      expect(row).toMatchObject({ algo, seed, episode: i + 1 });
      expect(typeof row.return).toBe('number');
      expect(typeof row.noisyReturn).toBe('number');
      expect(row.steps).toBeGreaterThan(0);
      expect(row.success).toBe(row.terminated);
      expect(row.globalStep).toBe(prev + row.steps);
      prev = row.globalStep;
    });
    const summary = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8'));
    expect(summary.envSteps).toBe(budget);
    expect(prev + (summary.partialEpisodeAtBudget?.steps ?? 0)).toBe(budget);
    expect(summary.rewardNoise).toMatchObject({ distribution: 'gaussian', mean: 0, sigma: noisy.rewardNoise.sigma, draws: budget });

    const q = readJsonl(join(dir, 'q-vs-return.jsonl'));
    const starts = probeStates(noisy);
    expect(q[0].step).toBe(0);
    expect(q.at(-1).step).toBe(budget);
    for (const row of q) {
      expect(row).toMatchObject({ algo, seed });
      for (const k of ['meanQMax', 'meanDiscountedReturn', 'meanDiscountedNoisyReturn', 'meanGap']) {
        expect(Number.isFinite(row[k]), k).toBe(true);
      }
      expect(row.meanGap).toBeCloseTo(row.meanQMax - row.meanDiscountedReturn, 9);
      expect(row.probes.map((p: { start: number }) => p.start)).toEqual(starts);
    }

    const run = JSON.parse(readFileSync(join(dir, 'run.json'), 'utf8'));
    expect(run.agentConfig).toEqual(buildAgentConfig(noisy, algo, seed));
    expect(run.durationMs).toBeGreaterThan(0);
    const evalNew = JSON.parse(readFileSync(join(dir, 'eval-new-process.json'), 'utf8'));
    expect(evalNew.identicalGreedyAction).toBe(true);
  });

  it.each(noisy.seeds as number[])('dqn and double-dqn drew the same noise (seed %i)', (seed) => {
    const read = (algo: string) => JSON.parse(readFileSync(join(outRoot, algo, `seed-${seed}`, 'summary.json'), 'utf8'));
    expect(read('double-dqn').rewardNoise).toEqual(read('dqn').rewardNoise);
  });

  it.each(ALGOS)('a fresh short run replays the first committed episodes (%s, seed 11)', async (algo) => {
    await tf.setBackend('cpu');
    const fresh = await runTraining({ AgentClass: DQNAgent, experiment: noisy, algo, seed: 11, envSteps: 800 });
    const committed = readJsonl(join(outRoot, algo, 'seed-11', 'episodes.jsonl')).slice(0, fresh.episodes.length);
    expect(fresh.episodes).toEqual(committed);
  }, 60_000);
});
