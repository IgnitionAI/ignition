/**
 * Local PPO training on the declared nav1d-discrete budget.
 * Reads packages/demo-target-chasing/ppo-experiment.json (frozen before this run).
 * Writes raw JSONL + summaries. Does not invent metrics.
 *
 * gitSha is `git rev-parse HEAD` at train time. Git cannot store a blob that
 * names the commit that contains it, so after the artifacts commit, gitSha is
 * the first parent of the commit that last modified public/ppo/manifest.json:
 *   jq -r .gitSha packages/demo-target-chasing/public/ppo/manifest.json
 *   git log -1 --format=%P -- packages/demo-target-chasing/public/ppo/manifest.json
 */
import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { PPOAgent } from '../dist/index.js';
import { fileSystemModelProvider } from './fs-provider.mjs';
import { mean, mulberry32, nav1dStep } from './nav1d.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const experimentPath = join(repoRoot, 'packages/demo-target-chasing/ppo-experiment.json');
const outRoot = join(repoRoot, 'packages/demo-target-chasing/public/ppo');

const GIT_SHA_RULE =
  'gitSha is git rev-parse HEAD at train time; after the artifacts are committed it equals the first parent of git log -1 --format=%H -- packages/demo-target-chasing/public/ppo/manifest.json';

const experiment = JSON.parse(readFileSync(experimentPath, 'utf8'));
const gitSha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
const nodeVersion = process.version;
const startedAt = new Date().toISOString();

mkdirSync(outRoot, { recursive: true });
writeFileSync(join(outRoot, 'experiment.json'), JSON.stringify(experiment, null, 2));

const { seeds, budget, agent: agentCfg } = experiment;
const firstN = 20;
const lastN = 20;

async function evaluateGreedy(agent, episodes, envRng) {
  const returns = [];
  for (let ep = 0; ep < episodes; ep++) {
    let pos = envRng() * 0.4;
    let total = 0;
    for (let step = 0; step < budget.maxStepsPerEpisode; step++) {
      const action = await agent.getAction([pos], true);
      const { newPos, reward, done } = nav1dStep(pos, action);
      total += reward;
      pos = newPos;
      if (done) break;
    }
    returns.push(total);
  }
  return returns;
}

async function greedyEpisodeFrom(agent, startPos) {
  let pos = startPos;
  let total = 0;
  const actions = [];
  for (let step = 0; step < budget.maxStepsPerEpisode; step++) {
    const action = await agent.getAction([pos], true);
    actions.push(action);
    const { newPos, reward, done } = nav1dStep(pos, action);
    total += reward;
    pos = newPos;
    if (done) break;
  }
  return { total, actions };
}

function greedyGap(row) {
  const untrained = row.untrainedGreedyEvalMean;
  const trained = row.greedyEvalMean;
  if (typeof untrained !== 'number' || typeof trained !== 'number') return Number.NEGATIVE_INFINITY;
  return trained - untrained;
}

const seedSummaries = [];

for (const seed of seeds) {
  const seedDir = join(outRoot, `seed-${seed}`);
  mkdirSync(seedDir, { recursive: true });
  const jsonlPath = join(seedDir, 'episodes.jsonl');
  writeFileSync(jsonlPath, '');

  const provider = fileSystemModelProvider(seedDir);
  const agent = new PPOAgent({
    inputSize: agentCfg.inputSize,
    actionSize: agentCfg.actionSize,
    actionSpace: agentCfg.actionSpace,
    hiddenLayers: agentCfg.hiddenLayers,
    lr: agentCfg.lr,
    gamma: agentCfg.gamma,
    gaeLambda: agentCfg.gaeLambda,
    clipRatio: agentCfg.clipRatio,
    epochs: agentCfg.epochs,
    batchSize: agentCfg.batchSize,
    entropyCoef: agentCfg.entropyCoef,
    valueLossCoef: agentCfg.valueLossCoef,
    seed,
    storageProvider: provider,
  });

  await agent.save('untrained');
  const probe = await agent.getAction([0.2], true);
  const untrainedFrom02 = await greedyEpisodeFrom(agent, 0.2);
  writeFileSync(
    join(seedDir, 'untrained-greedy.json'),
    JSON.stringify({
      state: [0.2],
      action: probe,
      episodeReturn: untrainedFrom02.total,
      actions: untrainedFrom02.actions,
    }),
  );
  const untrainedGreedyReturns = await evaluateGreedy(
    agent,
    experiment.eval.greedyEpisodes,
    mulberry32(seed * 17 + 3),
  );

  const envRng = mulberry32(seed * 1009);
  const episodeReturns = [];
  for (let ep = 0; ep < budget.episodesPerSeed; ep++) {
    let pos = envRng() * 0.4;
    let total = 0;
    let steps = 0;
    let terminated = false;
    for (let step = 0; step < budget.maxStepsPerEpisode; step++) {
      const state = [pos];
      const action = await agent.getAction(state);
      const { newPos, reward, done } = nav1dStep(pos, action);
      agent.remember({
        state,
        action,
        reward,
        nextState: [newPos],
        terminated: done,
        truncated: !done && step === budget.maxStepsPerEpisode - 1,
      });
      total += reward;
      steps += 1;
      pos = newPos;
      terminated = done;
      if (done) break;
    }
    if (budget.trainAfterEachEpisode) await agent.train();
    episodeReturns.push(total);
    appendFileSync(
      jsonlPath,
      `${JSON.stringify({ seed, episode: ep + 1, return: total, steps, terminated })}\n`,
    );
  }

  await agent.save('trained');
  const trainedProbe = await agent.getAction([0.2], true);
  const trainedFrom02 = await greedyEpisodeFrom(agent, 0.2);
  writeFileSync(
    join(seedDir, 'trained-greedy.json'),
    JSON.stringify({
      state: [0.2],
      action: trainedProbe,
      episodeReturn: trainedFrom02.total,
      actions: trainedFrom02.actions,
    }),
  );

  const greedyReturns = await evaluateGreedy(
    agent,
    experiment.eval.greedyEpisodes,
    mulberry32(seed * 17 + 3),
  );
  agent.dispose();

  const first = episodeReturns.slice(0, firstN);
  const last = episodeReturns.slice(-lastN);
  const firstMean = mean(first);
  const lastMean = mean(last);
  const improved = lastMean !== null && firstMean !== null && lastMean > firstMean;
  const untrainedGreedyEvalMean = mean(untrainedGreedyReturns);
  const greedyEvalMean = mean(greedyReturns);
  const summary = {
    seed,
    episodes: budget.episodesPerSeed,
    firstMean20: firstMean,
    lastMean20: lastMean,
    improved,
    untrainedGreedyEvalMean,
    greedyEvalMean,
    greedyGap:
      untrainedGreedyEvalMean !== null && greedyEvalMean !== null
        ? greedyEvalMean - untrainedGreedyEvalMean
        : null,
    untrainedGreedyEvalReturns: untrainedGreedyReturns,
    greedyEvalReturns: greedyReturns,
    untrainedGreedyActionAt02: probe,
    trainedGreedyActionAt02: trainedProbe,
    untrainedGreedyReturnAt02: untrainedFrom02.total,
    trainedGreedyReturnAt02: trainedFrom02.total,
    untrainedGreedyActionsAt02: untrainedFrom02.actions,
    trainedGreedyActionsAt02: trainedFrom02.actions,
  };
  writeFileSync(join(seedDir, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(seedDir, 'episodes.json'), JSON.stringify(episodeReturns));
  seedSummaries.push(summary);
  console.log(
    JSON.stringify({
      seed,
      improved,
      firstMean20: firstMean,
      lastMean20: lastMean,
      untrainedGreedyEvalMean,
      greedyEvalMean,
      greedyGap: summary.greedyGap,
      untrainedGreedyReturnAt02: untrainedFrom02.total,
      trainedGreedyReturnAt02: trainedFrom02.total,
    }),
  );
}

const anyImproved = seedSummaries.some((row) => row.improved);
const selected = seedSummaries.reduce((best, row) => (greedyGap(row) > greedyGap(best) ? row : best));
const selectedSeed = selected.seed;
const manifest = {
  gitSha,
  gitShaRule: GIT_SHA_RULE,
  nodeVersion,
  startedAt,
  finishedAt: new Date().toISOString(),
  experimentPath: 'packages/demo-target-chasing/ppo-experiment.json',
  selection: 'max(trainedGreedyEvalMean - untrainedGreedyEvalMean)',
  seeds,
  selectedSeed,
  anyImproved,
  summaries: seedSummaries.map((row) => ({
    seed: row.seed,
    improved: row.improved,
    firstMean20: row.firstMean20,
    lastMean20: row.lastMean20,
    untrainedGreedyEvalMean: row.untrainedGreedyEvalMean,
    greedyEvalMean: row.greedyEvalMean,
    greedyGap: row.greedyGap,
    untrainedGreedyReturnAt02: row.untrainedGreedyReturnAt02,
    trainedGreedyReturnAt02: row.trainedGreedyReturnAt02,
  })),
  checkpoints: {
    untrained: `seed-${selectedSeed}/untrained`,
    trained: `seed-${selectedSeed}/trained`,
  },
  logs: {
    episodesJsonl: seeds.map((seed) => `seed-${seed}/episodes.jsonl`),
    summaries: seeds.map((seed) => `seed-${seed}/summary.json`),
  },
};
writeFileSync(join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(outRoot, 'train-result.json'), JSON.stringify({ gitSha, nodeVersion, seedSummaries }, null, 2));
console.log(JSON.stringify({ gitSha, gitShaRule: GIT_SHA_RULE, selectedSeed, anyImproved }, null, 2));
