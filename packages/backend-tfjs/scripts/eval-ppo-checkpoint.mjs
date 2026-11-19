/**
 * New-process checkpoint eval: load a saved policy and compare greedy action
 * to the value recorded by the training process. Also runs greedy episodes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PPOAgent } from '../dist/index.js';
import { fileSystemModelProvider } from './fs-provider.mjs';
import { mean, mulberry32, nav1dStep } from './nav1d.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const outRoot = join(repoRoot, 'packages/demo-target-chasing/public/ppo');
const experiment = JSON.parse(
  readFileSync(join(repoRoot, 'packages/demo-target-chasing/ppo-experiment.json'), 'utf8'),
);
const manifest = JSON.parse(readFileSync(join(outRoot, 'manifest.json'), 'utf8'));
const seed = Number(process.argv[2] ?? manifest.selectedSeed);
const seedDir = join(outRoot, `seed-${seed}`);
const expected = JSON.parse(readFileSync(join(seedDir, 'trained-greedy.json'), 'utf8'));
const provider = fileSystemModelProvider(seedDir);
const agent = new PPOAgent({
  inputSize: experiment.agent.inputSize,
  actionSize: experiment.agent.actionSize,
  actionSpace: experiment.agent.actionSpace,
  hiddenLayers: experiment.agent.hiddenLayers,
  seed,
  storageProvider: provider,
});
await agent.load('trained');
const action = await agent.getAction(expected.state, true);
const match = action === expected.action;
const envRng = mulberry32(seed * 17 + 3);
const greedyReturns = [];
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
  process: 'eval-ppo-checkpoint',
  seed,
  loaded: 'trained',
  state: expected.state,
  expectedAction: expected.action,
  loadedAction: action,
  identicalGreedyAction: match,
  greedyEvalMean: mean(greedyReturns),
  greedyEvalReturns: greedyReturns,
};
writeFileSync(join(seedDir, 'eval-new-process.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!match) process.exit(2);
