/**
 * Local DQN vs Double DQN training on the declared Target Chasing (nav1d-discrete) budget.
 * Reads packages/demo-target-chasing/dqn-vs-double-experiment.json (frozen before the runs).
 * Writes raw JSONL + summaries + frozen policies under public/dqn-vs-double/<algo>/seed-<n>/.
 * Does not invent metrics.
 *
 * Usage:
 *   node scripts/train-dqn-target-chasing.mjs                 # all algos x all seeds
 *   node scripts/train-dqn-target-chasing.mjs --algo dqn --seed 11
 *   node scripts/train-dqn-target-chasing.mjs --steps 2000 --out /tmp/x   # speed probe, not an artifact
 *   node scripts/train-dqn-target-chasing.mjs --variant noisy  # reward-noise variant
 *     (reads dqn-vs-double-noisy-experiment.json, writes public/dqn-vs-double-noisy/)
 *
 * Then: node scripts/eval-dqn-checkpoint.mjs && node scripts/manifest-dqn-vs-double.mjs
 * (same --variant on all three scripts)
 *
 * gitSha is `git rev-parse HEAD` at train time (same rule as RL 1): after the
 * artifacts commit it is the first parent of the commit that last modified
 * public/<variant dir>/manifest.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../dist/index.js';
import { fileSystemModelProvider } from './fs-provider.mjs';
import { ALGOS, buildAgentConfig, runTraining, variantOf } from './dqn-target-chasing.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');

const { values } = parseArgs({
  options: {
    variant: { type: 'string' },
    algo: { type: 'string' },
    seed: { type: 'string' },
    steps: { type: 'string' },
    out: { type: 'string' },
  },
});

const variant = variantOf(values.variant);
const experimentPath = join(repoRoot, variant.experimentPath);
const defaultOut = join(repoRoot, variant.outDir);
const experiment = JSON.parse(readFileSync(experimentPath, 'utf8'));
const outRoot = values.out ?? defaultOut;
const envSteps = values.steps ? Number(values.steps) : undefined;
if (envSteps !== undefined && !values.out) {
  throw new Error('--steps overrides the declared budget: pass --out to a scratch directory');
}
const algos = values.algo ? [values.algo] : ALGOS;
const seeds = values.seed ? [Number(values.seed)] : experiment.seeds;
for (const seed of seeds) {
  if (!experiment.seeds.includes(seed)) throw new Error(`seed ${seed} is not declared`);
}

await tf.setBackend(experiment.agent.backend);
await tf.ready();

const gitSha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
const gitDirty = execSync('git status --porcelain', { cwd: repoRoot, encoding: 'utf8' }).trim() !== '';
const runtime = {
  gitSha,
  gitDirtyAtTrainTime: gitDirty,
  nodeVersion: process.version,
  platform: `${process.platform}-${process.arch}`,
  tfjsVersion: tf.version.tfjs,
  tfjsCoreVersion: tf.version['tfjs-core'],
  tfjsBackend: tf.getBackend(),
};

for (const algo of algos) {
  for (const seed of seeds) {
    const seedDir = join(outRoot, algo, `seed-${seed}`);
    mkdirSync(seedDir, { recursive: true });
    const startedAt = new Date().toISOString();
    const t0 = process.hrtime.bigint();
    const { summary } = await runTraining({
      AgentClass: DQNAgent,
      experiment,
      algo,
      seed,
      outDir: seedDir,
      provider: fileSystemModelProvider(seedDir),
      envSteps,
      log: (row) => console.error(JSON.stringify(row)),
    });
    const durationMs = Number(process.hrtime.bigint() - t0) / 1e6;
    const run = {
      algo,
      seed,
      agentConfig: buildAgentConfig(experiment, algo, seed),
      envSteps: summary.envSteps,
      trainSteps: summary.trainSteps,
      episodes: summary.episodes,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs,
      msPerEnvStep: durationMs / summary.envSteps,
      ...runtime,
    };
    writeFileSync(join(seedDir, 'run.json'), JSON.stringify(run, null, 2));
    console.log(
      JSON.stringify({
        algo,
        seed,
        durationMs: Math.round(durationMs),
        msPerEnvStep: run.msPerEnvStep,
        envSteps: summary.envSteps,
        episodes: summary.episodes,
        lastMeanReturn: summary.lastMeanReturn,
        lastSuccessRate: summary.lastSuccessRate,
        greedyEvalMean: summary.greedyEvalMean,
        greedySuccessRate: summary.greedySuccessRate,
        finalMeanGap: summary.finalQVsReturn.meanGap,
        meanGapSecondHalf: summary.meanGapSecondHalf,
      }),
    );
  }
}
