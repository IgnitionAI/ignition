/**
 * Local PPO training on the declared nav1d-discrete budget.
 * Reads packages/demo-target-chasing/ppo-experiment.json (frozen before this run).
 * Writes raw JSONL + summaries. Does not invent metrics.
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
  writeFileSync(join(seedDir, 'untrained-greedy.json'), JSON.stringify({ state: [0.2], action: probe }));

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
  writeFileSync(
    join(seedDir, 'trained-greedy.json'),
    JSON.stringify({ state: [0.2], action: trainedProbe }),
  );

  const evalRng = mulberry32(seed * 17 + 3);
  const greedyReturns = await evaluateGreedy(agent, experiment.eval.greedyEpisodes, evalRng);
  agent.dispose();

  const first = episodeReturns.slice(0, firstN);
  const last = episodeReturns.slice(-lastN);
  const firstMean = mean(first);
  const lastMean = mean(last);
  const improved = lastMean !== null && firstMean !== null && lastMean > firstMean;
  const summary = {
    seed,
    episodes: budget.episodesPerSeed,
    firstMean20: firstMean,
    lastMean20: lastMean,
    improved,
    greedyEvalMean: mean(greedyReturns),
    greedyEvalReturns: greedyReturns,
    untrainedGreedyActionAt02: probe,
    trainedGreedyActionAt02: trainedProbe,
  };
  writeFileSync(join(seedDir, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(seedDir, 'episodes.json'), JSON.stringify(episodeReturns));
  seedSummaries.push(summary);
  console.log(JSON.stringify({ seed, improved, firstMean20: firstMean, lastMean20: lastMean }));
}

const anyImproved = seedSummaries.some((row) => row.improved);
const selectedSeed = (seedSummaries.find((row) => row.improved) ?? seedSummaries[0]).seed;
const manifest = {
  gitSha,
  nodeVersion,
  startedAt,
  finishedAt: new Date().toISOString(),
  experimentPath: 'packages/demo-target-chasing/ppo-experiment.json',
  seeds,
  selectedSeed,
  anyImproved,
  summaries: seedSummaries.map((row) => ({
    seed: row.seed,
    improved: row.improved,
    firstMean20: row.firstMean20,
    lastMean20: row.lastMean20,
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
console.log(JSON.stringify({ gitSha, selectedSeed, anyImproved }, null, 2));
