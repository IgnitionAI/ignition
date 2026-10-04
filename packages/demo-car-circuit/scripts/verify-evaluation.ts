import * as tf from '@tensorflow/tfjs';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { IgnitionEnvTFJS, DQNAgent } from '@ignitionai/backend-tfjs';
import { CircuitEnv } from '../src/circuit-env';
import { CIRCUIT_PROTOCOL, evaluateCircuit } from '../src/evaluation';

const training = { seed: 11, transitions: 512, hiddenLayers: [16], batchSize: 32 };

function snapshot(agent: DQNAgent) {
  const weights = tf.tidy(() => agent.getModel().getWeights().map(weight => ({
    shape: [...weight.shape], values: Array.from(weight.dataSync()),
  })));
  if (weights.some(weight => weight.values.some(value => !Number.isFinite(value)))) {
    throw new Error('Nonfinite policy weights');
  }
  const state = Object.fromEntries(Object.entries(agent.getState()).map(([key, value]) => [
    key, typeof value === 'number' && !Number.isFinite(value) ? String(value) : value,
  ]));
  const payload = { weights, state };
  return { payload, hash: createHash('sha256').update(JSON.stringify(payload)).digest('hex') };
}

async function main() {
  await tf.setBackend('cpu');
  const track = CIRCUIT_PROTOCOL.circuits.training;
  const world = new CircuitEnv(track.straightLength, track.radius, track.halfWidth, {
    maxSteps: CIRCUIT_PROTOCOL.maxSteps, targetLaps: CIRCUIT_PROTOCOL.targetLaps,
  });
  const runner = new IgnitionEnvTFJS(world);
  try {
    runner.train('dqn', { seed: training.seed, hiddenLayers: training.hiddenLayers,
      batchSize: training.batchSize, backend: 'cpu' });
    runner.stop();
    for (let i = 0; i < training.transitions; i++) await runner.step();
    const agent = runner.agent;
    if (!(agent instanceof DQNAgent)) throw new Error('Expected a trained DQN');
    const trainingUpdates = agent.getState().trainStepCounter;
    if (typeof trainingUpdates !== 'number' || trainingUpdates <= 0) {
      throw new Error('Policy did not perform a training update');
    }
    const before = snapshot(agent);
    const policyId = `legacy-dqn-seed${training.seed}-${before.hash.slice(0, 12)}`;
    const train = await evaluateCircuit(agent, { policyId, circuit: 'training' });
    const test = await evaluateCircuit(agent, { policyId, circuit: 'test' });
    const repeat = await evaluateCircuit(agent, { policyId, circuit: 'test' });
    const after = snapshot(agent);
    const unchanged = before.hash === after.hash;
    const reproducible = JSON.stringify(test) === JSON.stringify(repeat);
    const bounded = [train, test].every(report => report.episodes.length === 3 &&
      report.episodes.every(episode => episode.transitions > 0 &&
        episode.transitions <= CIRCUIT_PROTOCOL.maxSteps &&
        Number.isFinite(episode.simulationSeconds)) &&
      report.totalTransitions === report.episodes.reduce((sum, episode) => sum + episode.transitions, 0));
    const report = { sourceCommit: process.argv[3] ?? 'unspecified',
      tensorflowVersion: tf.version.tfjs, backend: tf.getBackend(), training, trainingUpdates,
      observationSize: world.observe().length, actionSize: world.actions.length,
      policyId, beforeHash: before.hash, afterHash: after.hash,
      unchanged, reproducible, bounded, train, test,
      passed: unchanged && reproducible && bounded };
    const destination = process.argv[2] ?? '.scratch/circuit-evaluation';
    await mkdir(destination, { recursive: true });
    await writeFile(`${destination}/report.json`, JSON.stringify(report, null, 2) + '\n');
    await writeFile(`${destination}/policy-weights.json`, JSON.stringify(before.payload, null, 2) + '\n');
    console.log(JSON.stringify({ policyId, unchanged, reproducible, bounded,
      trainingSuccesses: train.successfulEpisodes, testSuccesses: test.successfulEpisodes,
      trainingEvaluationTransitions: train.totalTransitions, testEvaluationTransitions: test.totalTransitions,
      passed: report.passed }));
    if (!report.passed) process.exitCode = 1;
  } finally {
    runner.stop();
    runner.agent?.dispose?.();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
