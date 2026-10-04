import * as tf from '@tensorflow/tfjs';
import { ContinuousRunner } from '@ignitionai/core';
import { SACAgent } from '../src/agents/sac';
import { PointMassEnv } from '../examples/continuous/point-mass';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpus, platform, arch, release, totalmem } from 'node:os';
import { join } from 'node:path';

interface Protocol {
  id: string; trainingSeeds: number[]; evaluationSeeds: number[]; trainingInteractions: number;
  evaluationEpisodesPerSeed: number; episodeTicks: number; backend: string; hiddenLayers: number[];
  lr: number; gamma: number; alpha: number; tau: number; batchSize: number; memorySize: number;
  warmup: number; updateEvery: number; minimumSuccessesPerPolicy: number; minimumPassingPolicies: number;
  minimumMeanCostReduction: number; selection: string;
}
interface Episode {
  seed: number; episode: number; initial: number[]; final: number[]; steps: number;
  cost: number; success: boolean; terminated: boolean; truncated: boolean;
}

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const protocolPath = 'docs/design/sac-point-mass-protocol-v1.json';
const protocolBytes = readFileSync(protocolPath);
const protocol = JSON.parse(protocolBytes.toString()) as Protocol;
const directory = process.argv[2] ?? '.scratch/sac-point-mass-v1';
mkdirSync(directory, { recursive: true });
const sourcePaths = [protocolPath, 'packages/core/src/continuous.ts', 'packages/core/src/continuous-runner.ts',
  'packages/backend-tfjs/src/agents/sac.ts', 'packages/backend-tfjs/src/sac/config.ts',
  'packages/backend-tfjs/src/sac/network.ts', 'packages/backend-tfjs/src/sac/checkpoint.ts',
  'packages/backend-tfjs/src/memory/ReplayBuffer.ts', 'packages/backend-tfjs/examples/continuous/point-mass.ts',
  'packages/backend-tfjs/scripts/verify-sac-learning.ts'];
const manifest = { protocol, protocolSha256: hash(protocolBytes), createdAt: new Date().toISOString(),
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceHashes: Object.fromEntries(sourcePaths.map(path => [path, hash(readFileSync(path))])),
  machine: { node: process.version, tfjs: tf.version.tfjs, platform: platform(), arch: arch(),
    release: release(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryBytes: totalmem() } };
// Freeze provenance/configuration before initialization, training or evaluation; refuse overwrites.
writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });

async function evaluate(agent: SACAgent): Promise<Episode[]> {
  const before = hash(JSON.stringify(agent.exportCheckpoint()));
  const episodes: Episode[] = [];
  for (const seed of protocol.evaluationSeeds) {
    const env = new PointMassEnv(seed);
    for (let episode = 0; episode < protocol.evaluationEpisodesPerSeed; episode++) {
      if (episode > 0) env.reset();
      const initial = env.observe();
      let cost = 0;
      while (!env.terminated() && !env.truncated()) {
        env.step(await agent.getAction(env.observe(), true));
        cost -= env.reward();
      }
      episodes.push({ seed, episode, initial, final: env.observe(), cost, steps: env.steps,
        success: env.success, terminated: env.terminated(), truncated: env.truncated() });
    }
  }
  if (before !== hash(JSON.stringify(agent.exportCheckpoint()))) throw new Error('Evaluation modified SAC checkpoint');
  return episodes;
}

async function main(): Promise<void> {
  await tf.setBackend(protocol.backend); await tf.ready();
  const results: Record<string, unknown>[] = [];
  let passingPolicies = 0, baselineCost = 0, trainedCost = 0, failures = 0, pairedPolicies = 0;
  for (const seed of protocol.trainingSeeds) {
    const env = new PointMassEnv(seed);
    const agent = new SACAgent({ inputSize: 2, actionSpace: env.actionSpace, seed,
      hiddenLayers: protocol.hiddenLayers, lr: protocol.lr, gamma: protocol.gamma, alpha: protocol.alpha,
      tau: protocol.tau, batchSize: protocol.batchSize, memorySize: protocol.memorySize,
      warmup: protocol.warmup, updateEvery: protocol.updateEvery });
    const runner = new ContinuousRunner(env, agent), started = performance.now();
    try {
      const baseline = await evaluate(agent);
      const trainingStarted = performance.now();
      for (let step = 0; step < protocol.trainingInteractions; step++) {
        await runner.step();
        if ((step + 1) % 250 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        if ((step + 1) % 5000 === 0) console.log(JSON.stringify({ seed, step: step + 1, state: agent.getState() }));
      }
      const trainingMs = performance.now() - trainingStarted;
      const checkpoint = agent.exportCheckpoint(), checkpointJson = JSON.stringify(checkpoint);
      if (checkpoint.samples !== protocol.trainingInteractions || checkpoint.updates < 1) throw new Error('Incomplete training budget');
      writeFileSync(join(directory, `sac-${seed}.json`), checkpointJson, { flag: 'wx' });
      const trained = await evaluate(agent);
      const baselineScenarios = baseline.map(({ seed, episode, initial }) => ({ seed, episode, initial }));
      const trainedScenarios = trained.map(({ seed, episode, initial }) => ({ seed, episode, initial }));
      if (JSON.stringify(baselineScenarios) !== JSON.stringify(trainedScenarios)) throw new Error('Unequal evaluation scenarios');
      pairedPolicies++;
      const successes = trained.filter(episode => episode.success).length;
      if (successes >= protocol.minimumSuccessesPerPolicy) passingPolicies++;
      baselineCost += baseline.reduce((sum, episode) => sum + episode.cost, 0) / baseline.length;
      trainedCost += trained.reduce((sum, episode) => sum + episode.cost, 0) / trained.length;
      const result = { seed, baseline, trained, successes, samples: checkpoint.samples, updates: checkpoint.updates,
        trainingMs, totalMs: performance.now() - started, checkpointSha256: hash(checkpointJson) };
      results.push(result);
      writeFileSync(join(directory, `result-${seed}.json`), JSON.stringify(result, null, 2), { flag: 'wx' });
      console.log(JSON.stringify({ seed, successes, trainingMs, status: 'evaluated' }));
    } catch (error) {
      failures++;
      const result = { seed, error: String(error), state: agent.getState(), totalMs: performance.now() - started };
      results.push(result);
      writeFileSync(join(directory, `result-${seed}.json`), JSON.stringify(result, null, 2), { flag: 'wx' });
      console.error(JSON.stringify(result));
    } finally { await runner.stop(); agent.dispose(); }
  }
  const costReduction = baselineCost > 0 ? 1 - trainedCost / baselineCost : null;
  const passed = failures === 0 && passingPolicies >= protocol.minimumPassingPolicies
    && costReduction !== null && costReduction >= protocol.minimumMeanCostReduction;
  const report = { manifest, results, summary: { passed, failures, pairedPolicies, passingPolicies, costReduction,
    meanBaselineCost: pairedPolicies ? baselineCost / pairedPolicies : null,
    meanTrainedCost: pairedPolicies ? trainedCost / pairedPolicies : null } };
  writeFileSync(join(directory, 'report.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify(report.summary));
  if (!passed) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
