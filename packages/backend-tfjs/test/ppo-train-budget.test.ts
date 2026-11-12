import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { it } from 'vitest';
import { PPOAgent } from '../src/agents/ppo';
import { fileSystemModelProvider } from './helpers/file-system-model-provider';
import { mean, mulberry32, nav1dStep } from '../scripts/nav1d.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const experimentPath = join(repoRoot, 'packages/demo-target-chasing/ppo-experiment.json');
const outRoot = join(repoRoot, 'packages/demo-target-chasing/public/ppo');

async function evaluateGreedy(
  agent: PPOAgent,
  episodes: number,
  maxSteps: number,
  envRng: () => number,
): Promise<number[]> {
  const returns: number[] = [];
  for (let ep = 0; ep < episodes; ep++) {
    let pos = envRng() * 0.4;
    let total = 0;
    for (let step = 0; step < maxSteps; step++) {
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

async function greedyEpisodeFrom(
  agent: PPOAgent,
  startPos: number,
  maxSteps: number,
): Promise<{ total: number; actions: number[] }> {
  let pos = startPos;
  let total = 0;
  const actions: number[] = [];
  for (let step = 0; step < maxSteps; step++) {
    const action = await agent.getAction([pos], true);
    actions.push(action as number);
    const { newPos, reward, done } = nav1dStep(pos, action);
    total += reward;
    pos = newPos;
    if (done) break;
  }
  return { total, actions };
}

function greedyGap(row: Record<string, unknown>): number {
  const untrained = row.untrainedGreedyEvalMean;
  const trained = row.greedyEvalMean;
  if (typeof untrained !== 'number' || typeof trained !== 'number') return Number.NEGATIVE_INFINITY;
  return trained - untrained;
}

it.skipIf(!process.env.RUN_PPO_TRAIN)('trains the frozen nav1d PPO budget and writes raw logs', async () => {
  const experiment = JSON.parse(readFileSync(experimentPath, 'utf8')) as {
    seeds: number[];
    budget: { episodesPerSeed: number; maxStepsPerEpisode: number; trainAfterEachEpisode: boolean };
    agent: {
      inputSize: number;
      actionSize: number;
      actionSpace: 'discrete' | 'continuous';
      hiddenLayers: number[];
      lr: number;
      gamma: number;
      gaeLambda: number;
      clipRatio: number;
      epochs: number;
      batchSize: number;
      entropyCoef: number;
      valueLossCoef: number;
    };
    eval: { greedyEpisodes: number };
  };
  const gitSha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  const nodeVersion = process.version;
  const startedAt = new Date().toISOString();
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(join(outRoot, 'experiment.json'), JSON.stringify(experiment, null, 2));

  const { seeds, budget, agent: agentCfg } = experiment;
  const seedSummaries: Array<Record<string, unknown>> = [];

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
    const untrainedFrom02 = await greedyEpisodeFrom(agent, 0.2, budget.maxStepsPerEpisode);
    writeFileSync(
      join(seedDir, 'untrained-greedy.json'),
      JSON.stringify({ state: [0.2], action: probe, episodeReturn: untrainedFrom02.total, actions: untrainedFrom02.actions }),
    );
    const untrainedGreedyReturns = await evaluateGreedy(
      agent,
      experiment.eval.greedyEpisodes,
      budget.maxStepsPerEpisode,
      mulberry32(seed * 17 + 3),
    );
    const envRng = mulberry32(seed * 1009);
    const episodeReturns: number[] = [];
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
    const trainedFrom02 = await greedyEpisodeFrom(agent, 0.2, budget.maxStepsPerEpisode);
    writeFileSync(
      join(seedDir, 'trained-greedy.json'),
      JSON.stringify({ state: [0.2], action: trainedProbe, episodeReturn: trainedFrom02.total, actions: trainedFrom02.actions }),
    );
    const greedyReturns = await evaluateGreedy(
      agent,
      experiment.eval.greedyEpisodes,
      budget.maxStepsPerEpisode,
      mulberry32(seed * 17 + 3),
    );
    agent.dispose();
    const first = episodeReturns.slice(0, 20);
    const last = episodeReturns.slice(-20);
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
    console.log(JSON.stringify({
      seed,
      improved,
      firstMean20: firstMean,
      lastMean20: lastMean,
      untrainedGreedyEvalMean,
      greedyEvalMean,
      greedyGap: summary.greedyGap,
      untrainedGreedyReturnAt02: untrainedFrom02.total,
      trainedGreedyReturnAt02: trainedFrom02.total,
    }));
  }

  const anyImproved = seedSummaries.some((row) => row.improved === true);
  const selected = seedSummaries.reduce((best, row) => (greedyGap(row) > greedyGap(best) ? row : best));
  const selectedSeed = selected.seed as number;
  const manifest = {
    gitSha,
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
  console.log(JSON.stringify({ gitSha, selectedSeed, anyImproved }, null, 2));
}, 120_000);
