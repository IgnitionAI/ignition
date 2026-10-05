import * as tf from '@tensorflow/tfjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { IgnitionEnvTFJS } from '../src/ignition-env-tfjs';

const protocol = {
  id: 'ppo-public-reward-v1',
  seeds: [11, 29, 47],
  trainingTransitions: 512,
  evaluationActions: 200,
  rewardedActionThreshold: 0.8,
  environment: 'one observation, two actions; action 1 rewards +1, action 0 rewards -1; every step terminates',
  config: { hiddenLayers: [8], lr: 0.01, entropyCoef: 0, batchSize: 32 },
};

async function runSeed(seed: number) {
  const originalRandom = Math.random;
  let state = seed;
  Math.random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  let action = 0;
  const runner = new IgnitionEnvTFJS({
    actions: 2,
    observe: () => [0],
    step: selected => {
      if (typeof selected !== 'number') throw new Error('Expected a discrete PPO action');
      action = selected;
    },
    reward: () => action === 1 ? 1 : -1,
    done: () => true,
    reset: () => {},
  });
  try {
    runner.train('ppo', protocol.config);
    runner.stop();
    const policy = runner.agent;
    if (!policy) throw new Error('PPO policy was not created');
    const evaluate = async () => {
      let rewardedActions = 0;
      for (let i = 0; i < protocol.evaluationActions; i++) {
        rewardedActions += Number(await policy.getAction([0]) === 1);
      }
      return rewardedActions;
    };
    const before = await evaluate();
    for (let i = 0; i < protocol.trainingTransitions; i++) await runner.step();
    const after = await evaluate();
    const rate = after / protocol.evaluationActions;
    return { seed, before, after, rate, passed: rate > protocol.rewardedActionThreshold };
  } finally {
    runner.stop();
    runner.agent?.dispose?.();
    Math.random = originalRandom;
  }
}

async function main() {
  await tf.setBackend('cpu');
  const results = [];
  for (const seed of protocol.seeds) results.push(await runSeed(seed));
  const report = { protocol, sourceCommit: process.argv[3] ?? 'unspecified',
    tensorflowVersion: tf.version.tfjs, results, passed: results.every(result => result.passed) };
  const path = process.argv[2] ?? '.scratch/ppo-learning.json';
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
