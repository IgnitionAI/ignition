/**
 * Builds public/<variant dir>/experiment.json (declared config + measured runtime per run)
 * and public/<variant dir>/manifest.json (every artifact with bytes and sha256, plus the
 * per-run summaries), so a page can report exactly which artifact is missing or altered.
 * Fails (exit 1) if any expected artifact is absent. Run after train and eval.
 *
 * Usage: node scripts/manifest-dqn-vs-double.mjs [--variant noisy]
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ALGOS, variantOf } from './dqn-target-chasing.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const { values } = parseArgs({ options: { variant: { type: 'string' } } });
const variant = variantOf(values.variant);
const outRoot = join(repoRoot, variant.outDir);
const declaredPath = variant.experimentPath;
const declared = JSON.parse(readFileSync(join(repoRoot, declaredPath), 'utf8'));

export const RUN_FILES = [
  'episodes.jsonl',
  'q-vs-return.jsonl',
  'summary.json',
  'run.json',
  'untrained-greedy.json',
  'trained-greedy.json',
  'eval-new-process.json',
  'untrained/model.json',
  'untrained/weights.bin',
  'trained/model.json',
  'trained/weights.bin',
];

const GIT_SHA_RULE =
  `gitSha is git rev-parse HEAD at train time; after the artifacts are committed it equals the first parent of git log -1 --format=%H -- ${variant.outDir}/manifest.json`;

const readJson = (rel) => JSON.parse(readFileSync(join(outRoot, rel), 'utf8'));
const missing = [];
const runs = [];
const summaries = [];
for (const algo of ALGOS) {
  for (const seed of declared.seeds) {
    const base = `${algo}/seed-${seed}`;
    for (const f of RUN_FILES) if (!existsSync(join(outRoot, base, f))) missing.push(`${base}/${f}`);
    if (missing.length) continue;
    const run = readJson(`${base}/run.json`);
    const summary = readJson(`${base}/summary.json`);
    const evalNew = readJson(`${base}/eval-new-process.json`);
    runs.push(run);
    summaries.push({
      algo,
      seed,
      envSteps: summary.envSteps,
      episodes: summary.episodes,
      lastMeanReturn: summary.lastMeanReturn,
      lastSuccessRate: summary.lastSuccessRate,
      greedyEvalMean: summary.greedyEvalMean,
      greedySuccessRate: summary.greedySuccessRate,
      finalMeanQMax: summary.finalQVsReturn.meanQMax,
      finalMeanDiscountedReturn: summary.finalQVsReturn.meanDiscountedReturn,
      finalMeanGap: summary.finalQVsReturn.meanGap,
      meanGapOverRun: summary.meanGapOverRun,
      meanGapSecondHalf: summary.meanGapSecondHalf,
      ...(summary.rewardNoise
        ? {
            lastMeanNoisyReturn: summary.lastMeanNoisyReturn,
            finalMeanDiscountedNoisyReturn: summary.finalQVsReturn.meanDiscountedNoisyReturn,
            rewardNoiseSampleMean: summary.rewardNoise.sampleMean,
            rewardNoiseSampleStd: summary.rewardNoise.sampleStd,
          }
        : {}),
      newProcessIdenticalGreedyAction: evalNew.identicalGreedyAction,
      newProcessIdenticalReplay: evalNew.identicalReplay,
      durationMs: run.durationMs,
    });
  }
}
if (missing.length) {
  console.error(JSON.stringify({ error: 'missing artifacts', missing }, null, 2));
  process.exit(1);
}

const shas = new Set(runs.map((r) => r.gitSha));
const envSteps = new Set(runs.map((r) => r.envSteps));
if (envSteps.size !== 1) throw new Error(`runs do not share one budget: ${[...envSteps]}`);
const experiment = {
  ...declared,
  declaredPath,
  runtime: {
    gitSha: runs[0].gitSha,
    gitShaRule: GIT_SHA_RULE,
    allRunsSameGitSha: shas.size === 1,
    nodeVersion: runs[0].nodeVersion,
    platform: runs[0].platform,
    tfjsVersion: runs[0].tfjsVersion,
    tfjsBackend: runs[0].tfjsBackend,
    startedAt: runs.map((r) => r.startedAt).sort()[0],
    finishedAt: runs.map((r) => r.finishedAt).sort().at(-1),
    totalDurationMs: runs.reduce((s, r) => s + r.durationMs, 0),
  },
  runs: runs.map((r) => ({
    algo: r.algo,
    seed: r.seed,
    envSteps: r.envSteps,
    trainSteps: r.trainSteps,
    episodes: r.episodes,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    durationMs: r.durationMs,
    msPerEnvStep: r.msPerEnvStep,
    gitSha: r.gitSha,
    nodeVersion: r.nodeVersion,
    tfjsVersion: r.tfjsVersion,
    tfjsBackend: r.tfjsBackend,
  })),
};
writeFileSync(join(outRoot, 'experiment.json'), `${JSON.stringify(experiment, null, 2)}\n`);

const sha256 = (rel) => createHash('sha256').update(readFileSync(join(outRoot, rel))).digest('hex');
const bytes = (rel) => readFileSync(join(outRoot, rel)).byteLength;
const artifact = (rel) => ({ path: rel, bytes: bytes(rel), sha256: sha256(rel) });
const manifest = {
  gitSha: experiment.runtime.gitSha,
  gitShaRule: GIT_SHA_RULE,
  experiment: artifact('experiment.json'),
  algorithms: ALGOS,
  order: 'dqn first, then double-dqn',
  seeds: declared.seeds,
  budget: { envStepsPerRun: declared.budget.envStepsPerRun },
  gamma: declared.agent.gamma,
  ...(declared.rewardNoise ? { rewardNoise: declared.rewardNoise } : {}),
  summaries,
  runs: Object.fromEntries(
    ALGOS.map((algo) => [
      algo,
      Object.fromEntries(
        declared.seeds.map((seed) => [
          String(seed),
          Object.fromEntries(RUN_FILES.map((f) => [f, artifact(`${algo}/seed-${seed}/${f}`)])),
        ]),
      ),
    ]),
  ),
};
writeFileSync(join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ gitSha: manifest.gitSha, artifacts: ALGOS.length * declared.seeds.length * RUN_FILES.length + 1 }));
