/**
 * New-process eval of the frozen DQN / Double DQN policies.
 * For each algo and seed: load trained/ from disk, compare the greedy action and the
 * Q-values at the replay state with the values recorded by the training process,
 * replay the greedy episode from 0.2, and run the greedy eval episodes.
 * Writes <algo>/seed-<n>/eval-new-process.json. Exit code 2 if any greedy action differs.
 *
 * Usage: node scripts/eval-dqn-checkpoint.mjs [--algo dqn] [--seed 11]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../dist/index.js';
import { fileSystemModelProvider } from './fs-provider.mjs';
import { ALGOS, buildAgentConfig, evaluateGreedy, greedyEpisodeFrom } from './dqn-target-chasing.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const outRoot = join(repoRoot, 'packages/demo-target-chasing/public/dqn-vs-double');
const experiment = JSON.parse(
  readFileSync(join(repoRoot, 'packages/demo-target-chasing/dqn-vs-double-experiment.json'), 'utf8'),
);
const { values } = parseArgs({ options: { algo: { type: 'string' }, seed: { type: 'string' } } });
const algos = values.algo ? [values.algo] : ALGOS;
const seeds = values.seed ? [Number(values.seed)] : experiment.seeds;

await tf.setBackend(experiment.agent.backend);
await tf.ready();

let allMatch = true;
for (const algo of algos) {
  for (const seed of seeds) {
    const seedDir = join(outRoot, algo, `seed-${seed}`);
    const expected = JSON.parse(readFileSync(join(seedDir, 'trained-greedy.json'), 'utf8'));
    const agent = new DQNAgent({
      ...buildAgentConfig(experiment, algo, seed),
      storageProvider: fileSystemModelProvider(seedDir),
    });
    try {
      await agent.load('trained');
      const action = await agent.getAction(expected.state, true);
      const q = tf.tidy(() => agent.getModel().predict(tf.tensor2d([expected.state])).arraySync()[0]);
      const maxAbsQDiff = Math.max(...q.map((v, i) => Math.abs(v - expected.q[i])));
      const replay = await greedyEpisodeFrom(agent, experiment, expected.state[0]);
      const greedy = await evaluateGreedy(agent, experiment, seed);
      const identicalReplay =
        replay.actions.length === expected.actions.length &&
        replay.actions.every((a, i) => a === expected.actions[i]);
      const match = action === expected.action && identicalReplay;
      allMatch &&= match;
      const result = {
        process: 'eval-dqn-checkpoint',
        algo,
        seed,
        loaded: 'trained',
        tfjsBackend: tf.getBackend(),
        state: expected.state,
        expectedAction: expected.action,
        loadedAction: action,
        identicalGreedyAction: action === expected.action,
        expectedQ: expected.q,
        loadedQ: q,
        maxAbsQDiff,
        replay,
        identicalReplay,
        ...greedy,
      };
      writeFileSync(join(seedDir, 'eval-new-process.json'), JSON.stringify(result, null, 2));
      console.log(
        JSON.stringify({ algo, seed, identicalGreedyAction: result.identicalGreedyAction, identicalReplay, maxAbsQDiff,
          greedyEvalMean: greedy.greedyEvalMean, greedySuccessRate: greedy.greedySuccessRate }),
      );
    } finally {
      agent.dispose();
    }
  }
}
if (!allMatch) process.exit(2);
