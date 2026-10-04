import * as tf from '@tensorflow/tfjs';
import { SACAgent } from '../src/agents/sac';
import { PointMassEnv } from '../examples/continuous/point-mass';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { deepStrictEqual, strictEqual, ok } from 'node:assert';

interface Protocol {
  id: string; trainingSeeds: number[]; evaluationSeeds: number[]; trainingInteractions: number;
  evaluationEpisodesPerSeed: number; episodeTicks: number; backend: string; hiddenLayers: number[];
  lr: number; gamma: number; alpha: number; tau: number; batchSize: number; memorySize: number;
  warmup: number; updateEvery: number; minimumSuccessesPerPolicy: number; minimumPassingPolicies: number;
  minimumMeanCostReduction: number;
}
interface Episode {
  seed: number; episode: number; initial: number[]; final: number[]; steps: number;
  cost: number; success: boolean; terminated: boolean; truncated: boolean;
}
interface Result {
  seed: number; baseline: Episode[]; trained: Episode[]; successes: number; samples: number;
  updates: number; checkpointSha256: string; trainingMs: number; totalMs: number; error?: string;
}
interface Manifest {
  protocol: Protocol; protocolSha256: string; sourceCommit: string; sourceHashes: Record<string, string>;
  machine: { tfjs: string; node: string };
}
interface Report {
  manifest: Manifest; results: Result[];
  summary: { passed: boolean; failures: number; pairedPolicies: number; passingPolicies: number;
    costReduction: number | null; meanBaselineCost: number | null; meanTrainedCost: number | null };
}
const sha256 = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const json = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const protocolPath = 'docs/design/sac-point-mass-protocol-v1.json';
const protocol = json<Protocol>(protocolPath);

function createAgent(seed: number): SACAgent {
  return new SACAgent({ inputSize: 2, actionSpace: new PointMassEnv(seed).actionSpace, seed,
    hiddenLayers: protocol.hiddenLayers, lr: protocol.lr, gamma: protocol.gamma, alpha: protocol.alpha,
    tau: protocol.tau, batchSize: protocol.batchSize, memorySize: protocol.memorySize,
    warmup: protocol.warmup, updateEvery: protocol.updateEvery });
}

/** Re-execute complete episodes after reconstructing/loading the actual public policy. */
async function reproduce(agent: SACAgent): Promise<Episode[]> {
  const before = JSON.stringify(agent.exportCheckpoint());
  const episodes: Episode[] = [];
  for (const seed of protocol.evaluationSeeds) {
    const env = new PointMassEnv(seed);
    for (let episode = 0; episode < protocol.evaluationEpisodesPerSeed; episode++) {
      if (episode) env.reset();
      const initial = env.observe();
      let cost = 0;
      while (!env.terminated() && !env.truncated()) {
        env.step(await agent.getAction(env.observe(), true)); cost -= env.reward();
      }
      episodes.push({ seed, episode, initial, final: env.observe(), steps: env.steps, cost,
        success: env.success, terminated: env.terminated(), truncated: env.truncated() });
      if (episode % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  strictEqual(JSON.stringify(agent.exportCheckpoint()), before, 'Evaluation mutated policy/RNG/counters/targets');
  return episodes;
}

function checkProvenance(manifest: Manifest): void {
  deepStrictEqual(manifest.protocol, protocol, 'Frozen protocol differs');
  strictEqual(manifest.protocolSha256, sha256(readFileSync(protocolPath)));
  strictEqual(manifest.machine.tfjs, tf.version.tfjs, 'Reproduction TFJS version differs');
  strictEqual(manifest.machine.node, process.version, 'Reproduction Node version differs');
  ok(/^[a-f0-9]{40}$/.test(manifest.sourceCommit));
  for (const [path, expected] of Object.entries(manifest.sourceHashes)) {
    strictEqual(sha256(readFileSync(path)), expected, `Current source changed: ${path}`);
    const committed = execFileSync('git', ['show', `${manifest.sourceCommit}:${path}`]);
    strictEqual(sha256(committed), expected, `Manifest source differs from committed provenance: ${path}`);
  }
}

async function main(): Promise<void> {
  const directory = process.argv[2];
  if (!directory) throw new Error('Pass the complete benchmark artifact directory');
  const report = json<Report>(join(directory, 'report.json'));
  deepStrictEqual(report.manifest, json<Manifest>(join(directory, 'manifest.json')));
  checkProvenance(report.manifest);
  deepStrictEqual(report.results.map(result => result.seed), protocol.trainingSeeds);
  await tf.setBackend(protocol.backend); await tf.ready();
  const policies: { seed: number; successes: number; meanBaselineCost: number; meanTrainedCost: number }[] = [];
  let failures = 0, passingPolicies = 0;
  for (const result of report.results) {
    deepStrictEqual(result, json<Result>(join(directory, `result-${result.seed}.json`)));
    if (result.error !== undefined) { ok(typeof result.error === 'string'); failures++; continue; }
    const bytes = readFileSync(join(directory, `sac-${result.seed}.json`));
    strictEqual(sha256(bytes), result.checkpointSha256);
    const baseline = createAgent(result.seed), restored = createAgent(result.seed);
    try {
      restored.loadCheckpoint(JSON.parse(bytes.toString()));
      const checkpoint = restored.exportCheckpoint();
      strictEqual(checkpoint.samples, protocol.trainingInteractions);
      const firstUpdate = Math.ceil(Math.max(protocol.warmup, protocol.batchSize) / protocol.updateEvery) * protocol.updateEvery;
      const expectedUpdates = Math.floor((protocol.trainingInteractions - firstUpdate) / protocol.updateEvery) + 1;
      strictEqual(checkpoint.updates, expectedUpdates);
      strictEqual(result.samples, checkpoint.samples); strictEqual(result.updates, checkpoint.updates);
      ok(Number.isFinite(result.trainingMs) && result.trainingMs > 0);
      ok(Number.isFinite(result.totalMs) && result.totalMs >= result.trainingMs);
      deepStrictEqual(await reproduce(baseline), result.baseline, `Baseline episodes do not reproduce: ${result.seed}`);
      deepStrictEqual(await reproduce(restored), result.trained, `Loaded final-policy episodes do not reproduce: ${result.seed}`);
      const successes = result.trained.filter(episode => episode.success).length;
      strictEqual(successes, result.successes);
      if (successes >= protocol.minimumSuccessesPerPolicy) passingPolicies++;
      const mean = (episodes: Episode[]) => episodes.reduce((sum, episode) => sum + episode.cost, 0) / episodes.length;
      policies.push({ seed: result.seed, successes, meanBaselineCost: mean(result.baseline), meanTrainedCost: mean(result.trained) });
      console.error(JSON.stringify({ seed: result.seed, status: 'checkpoint and all baseline/trained episodes reproduced' }));
    } finally { baseline.dispose(); restored.dispose(); }
  }
  const meanBaselineCost = policies.length ? policies.reduce((sum, policy) => sum + policy.meanBaselineCost, 0) / policies.length : null;
  const meanTrainedCost = policies.length ? policies.reduce((sum, policy) => sum + policy.meanTrainedCost, 0) / policies.length : null;
  const costReduction = meanBaselineCost !== null && meanBaselineCost > 0 && meanTrainedCost !== null
    ? 1 - meanTrainedCost / meanBaselineCost : null;
  const passed = failures === 0 && passingPolicies >= protocol.minimumPassingPolicies
    && costReduction !== null && costReduction >= protocol.minimumMeanCostReduction;
  strictEqual(report.summary.passed, passed); strictEqual(report.summary.failures, failures);
  strictEqual(report.summary.pairedPolicies, policies.length); strictEqual(report.summary.passingPolicies, passingPolicies);
  for (const [actual, expected] of [[report.summary.costReduction, costReduction],
    [report.summary.meanBaselineCost, meanBaselineCost], [report.summary.meanTrainedCost, meanTrainedCost]]) {
    if (expected === null) strictEqual(actual, null);
    else ok(actual !== null && Math.abs(actual - expected) <= 1e-12, 'Recomputed summary differs');
  }
  console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), directory, reportSha256: sha256(readFileSync(join(directory, 'report.json'))),
    provenanceVerified: true, checkpointsReloaded: policies.length,
    episodesReproduced: policies.length * protocol.evaluationSeeds.length * protocol.evaluationEpisodesPerSeed * 2,
    policies, summary: { passed, failures, passingPolicies, meanBaselineCost, meanTrainedCost, costReduction } }, null, 2));
  if (!passed) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
