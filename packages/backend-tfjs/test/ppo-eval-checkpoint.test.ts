import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it, expect } from 'vitest';
import { PPOAgent } from '../src/agents/ppo';
import { fileSystemModelProvider } from './helpers/file-system-model-provider';
import { mean, mulberry32, nav1dStep } from '../scripts/nav1d.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const outRoot = join(repoRoot, 'packages/demo-target-chasing/public/ppo');

it.skipIf(!process.env.RUN_PPO_EVAL)('loads the trained checkpoint in this new process and matches recorded greedy action', async () => {
  const experiment = JSON.parse(
    readFileSync(join(repoRoot, 'packages/demo-target-chasing/ppo-experiment.json'), 'utf8'),
  ) as {
    agent: { inputSize: number; actionSize: number; actionSpace: 'discrete' | 'continuous'; hiddenLayers: number[] };
    budget: { maxStepsPerEpisode: number };
    eval: { greedyEpisodes: number };
  };
  const manifest = JSON.parse(readFileSync(join(outRoot, 'manifest.json'), 'utf8')) as { selectedSeed: number };
  const seed = Number(process.env.PPO_EVAL_SEED ?? manifest.selectedSeed);
  const seedDir = join(outRoot, `seed-${seed}`);
  const expected = JSON.parse(readFileSync(join(seedDir, 'trained-greedy.json'), 'utf8')) as {
    state: number[];
    action: number;
  };
  const agent = new PPOAgent({
    inputSize: experiment.agent.inputSize,
    actionSize: experiment.agent.actionSize,
    actionSpace: experiment.agent.actionSpace,
    hiddenLayers: experiment.agent.hiddenLayers,
    seed,
    storageProvider: fileSystemModelProvider(seedDir),
  });
  await agent.load('trained');
  const action = await agent.getAction(expected.state, true);
  const greedyReturns: number[] = [];
  const envRng = mulberry32(seed * 17 + 3);
  for (let ep = 0; ep < experiment.eval.greedyEpisodes; ep++) {
    let pos = envRng() * 0.4;
    let total = 0;
    for (let step = 0; step < experiment.budget.maxStepsPerEpisode; step++) {
      const a = await agent.getAction([pos], true);
      const { newPos, reward, done } = nav1dStep(pos, a);
      total += reward;
      pos = newPos;
      if (done) break;
    }
    greedyReturns.push(total);
  }
  agent.dispose();
  const result = {
    process: 'ppo-eval-checkpoint.test.ts',
    seed,
    loaded: 'trained',
    state: expected.state,
    expectedAction: expected.action,
    loadedAction: action,
    identicalGreedyAction: action === expected.action,
    greedyEvalMean: mean(greedyReturns),
    greedyEvalReturns: greedyReturns,
  };
  writeFileSync(join(seedDir, 'eval-new-process.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  expect(action).toBe(expected.action);
}, 30_000);
