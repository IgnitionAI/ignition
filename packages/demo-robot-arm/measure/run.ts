/**
 * Measurement protocol for issue #64 — real DQN training, real inference,
 * same controller and preset as the browser demo.
 *
 *   pnpm --filter demo-robot-arm measure [SHA]
 *
 * Budget per seed: 5000 transitions OR 3 minutes (first limit reached).
 * Outputs raw JSON to evidence/<SHA>/raw/ for the article and the report.
 */
import '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import type { AgentInterface } from '@ignitionai/core';
import { RobotArmEnv, createRng, EpisodeStats } from '../src/robot-arm-env';
import {
  PROTOCOL_ID,
  TRAIN_SEEDS,
  MAX_TRANSITIONS_PER_SEED,
  MAX_MINUTES_PER_SEED,
  envSeedFor,
  baselineSeed,
  buildTargetSplit,
  evalEpisodes,
  evalEpisodeSpec,
  DQN_PRESET,
} from '../src/protocol';
import { RobotArmController, snapshotWeights, weightsDelta } from '../src/controller';

const __dirname = dirname(fileURLToPath(import.meta.url));
const demoRoot = join(__dirname, '..');

function resolveSha(): string {
  const arg = process.argv[2];
  if (arg) return arg;
  try {
    return execSync('git rev-parse --short HEAD', { cwd: demoRoot }).toString().trim();
  } catch {
    return 'local';
  }
}

const SHA = resolveSha();
const outDir = join(demoRoot, 'evidence', SHA, 'raw');
mkdirSync(outDir, { recursive: true });

interface EvalAggregate {
  label: string;
  episodes: EpisodeStats[];
  successes: number;
  truncations: number;
  finalDistanceMean: number;
  finalDistanceMedian: number;
  commandsToSuccessMean: number | null;
  commandsToSuccessN: number;
  blockedTotal: number;
  returnMean: number;
  commandsTotal: number;
}

function aggregate(label: string, episodes: EpisodeStats[]): EvalAggregate {
  const n = episodes.length;
  const successes = episodes.filter((e) => e.success);
  const distances = episodes.map((e) => e.finalDistance).sort((a, b) => a - b);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return {
    label,
    episodes,
    successes: successes.length,
    truncations: episodes.filter((e) => e.truncated).length,
    finalDistanceMean: n ? sum(distances) / n : 0,
    finalDistanceMedian: n ? distances[Math.floor(n / 2)] : 0,
    commandsToSuccessMean: successes.length ? sum(successes.map((e) => e.commandsToSuccess ?? e.commands)) / successes.length : null,
    commandsToSuccessN: successes.length,
    blockedTotal: sum(episodes.map((e) => e.blocked)),
    returnMean: n ? sum(episodes.map((e) => e.return)) / n : 0,
    commandsTotal: sum(episodes.map((e) => e.commands)),
  };
}

/** Greedy evaluation of one policy on the frozen declared episodes. */
async function evaluateGreedy(agent: AgentInterface, seedBase: number): Promise<EvalAggregate> {
  const episodes: EpisodeStats[] = [];
  for (const spec of evalEpisodes()) {
    const env = new RobotArmEnv(envSeedFor(seedBase) + spec.index);
    env.reset(spec.target);
    env.setConfig(spec.start);
    let guard = 0;
    while (!env.done() && guard < spec.maxCommands) {
      const action = await agent.getAction(env.observe(), true);
      env.step(action);
      guard++;
    }
    episodes.push(env.currentStats);
  }
  return aggregate('greedy', episodes);
}

/** Seeded uniform-random baseline on the exact same episodes and starts. */
function evaluateRandomBaseline(seedBase: number): EvalAggregate {
  const episodes: EpisodeStats[] = [];
  for (const spec of evalEpisodes()) {
    const rng = createRng(baselineSeed + spec.index);
    const env = new RobotArmEnv(envSeedFor(seedBase) + spec.index);
    env.reset(spec.target);
    env.setConfig(spec.start);
    let guard = 0;
    while (!env.done() && guard < spec.maxCommands) {
      env.step(Math.floor(rng() * 6));
      guard++;
    }
    episodes.push(env.currentStats);
  }
  return aggregate('random-uniform', episodes);
}

/** Validation split (reported only — the preset is fixed, no selection performed). */
async function evaluateValidation(agent: AgentInterface, seedBase: number): Promise<EvalAggregate> {
  const validation = buildTargetSplit().validation;
  const episodes: EpisodeStats[] = [];
  for (let i = 0; i < validation.length; i++) {
    const spec = evalEpisodeSpec(i, validation[i]);
    const env = new RobotArmEnv(envSeedFor(seedBase) + 100 + spec.index);
    env.reset(spec.target);
    env.setConfig(spec.start);
    let guard = 0;
    while (!env.done() && guard < spec.maxCommands) {
      const action = await agent.getAction(env.observe(), true);
      env.step(action);
      guard++;
    }
    episodes.push(env.currentStats);
  }
  return aggregate('validation-greedy', episodes);
}

async function main() {
  await tf.ready();
  const backend = tf.getBackend();
  const tfVersion = tf.version.tfjs;
  console.log(`[measure] protocol=${PROTOCOL_ID} sha=${SHA} backend=${backend} tfjs=${tfVersion}`);

  const machine = {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().map((c) => c.model),
    cpuCount: os.cpus().length,
    totalMemoryGb: Math.round((os.totalmem() / 2 ** 30) * 10) / 10,
    node: process.version,
    tfjs: tfVersion,
    backend,
  };
  writeFileSync(join(outDir, 'machine.json'), JSON.stringify(machine, null, 2));

  writeFileSync(
    join(outDir, 'protocol.json'),
    JSON.stringify(
      {
        protocolId: PROTOCOL_ID,
        trainSeeds: [...TRAIN_SEEDS],
        budget: { maxTransitionsPerSeed: MAX_TRANSITIONS_PER_SEED, maxMinutesPerSeed: MAX_MINUTES_PER_SEED },
        targetSplit: buildTargetSplit(),
        evalEpisodes: evalEpisodes(),
        baselineSeed,
        dqnPreset: DQN_PRESET,
        network: '6 -> 64 ReLU -> 64 ReLU -> 6',
      },
      null,
      2,
    ),
  );

  const results: Record<string, unknown>[] = [];
  for (const seed of TRAIN_SEEDS) {
    const started = Date.now();
    const controller = new RobotArmController(seed, envSeedFor(seed));
    await controller.prepare(); // agent created, loops stopped: measurement drives stepOnce()
    const agent = controller.getAgent()!;
    const model = controller.getModel()!;

    const weightsBefore = snapshotWeights(model);
    const evalInitial = await evaluateGreedy(agent, seed);
    const validationInitial = await evaluateValidation(agent, seed);

    // training with the frozen budget: 5000 transitions OR 3 minutes
    const trainEpisodes: EpisodeStats[] = [];
    let seenEpisodes = 0;
    let stoppedBy: 'transitions' | 'time' = 'transitions';
    while (true) {
      if (controller.snapshot().transitions >= MAX_TRANSITIONS_PER_SEED) {
        stoppedBy = 'transitions';
        break;
      }
      if (Date.now() - started >= MAX_MINUTES_PER_SEED * 60_000) {
        stoppedBy = 'time';
        break;
      }
      await controller.stepOnce();
      const snap = controller.snapshot();
      if (snap.episodes > seenEpisodes && snap.lastEpisode) {
        seenEpisodes = snap.episodes;
        trainEpisodes.push(snap.lastEpisode);
      }
    }

    const durationMs = Date.now() - started;
    const transitions = controller.snapshot().transitions;
    const updates = controller.updateCount;
    const epsilon = controller.epsilon;
    const weightsAfter = snapshotWeights(model);
    const weightDeltaTotal = weightsDelta(weightsBefore, weightsAfter);

    const evalFinal = await evaluateGreedy(agent, seed);
    const validationFinal = await evaluateValidation(agent, seed);
    controller.dispose();

    const seedResult = {
      seed,
      stoppedBy,
      budget: { maxTransitions: MAX_TRANSITIONS_PER_SEED, maxMinutes: MAX_MINUTES_PER_SEED },
      transitions,
      updates,
      epsilon,
      durationMs,
      transitionsPerSecond: Math.round((transitions / (durationMs / 1000)) * 100) / 100,
      trainEpisodes,
      trainSuccesses: trainEpisodes.filter((e) => e.success).length,
      trainTruncations: trainEpisodes.filter((e) => e.truncated).length,
      weightDeltaTotal,
      evalInitial,
      evalFinal,
      validationInitial,
      validationFinal,
    };
    results.push(seedResult);
    writeFileSync(join(outDir, `seed-${seed}.json`), JSON.stringify(seedResult, null, 2));
    console.log(
      `[measure] seed=${seed} stoppedBy=${stoppedBy} transitions=${transitions} updates=${updates} ` +
        `epsilon=${epsilon?.toFixed(4)} wDelta=${weightDeltaTotal.toFixed(4)} ` +
        `final=${evalFinal.successes}/20 succ, dMean=${evalFinal.finalDistanceMean.toFixed(3)} ` +
        `(${Math.round(durationMs / 1000)}s)`,
    );
  }

  const baseline = evaluateRandomBaseline(0);
  writeFileSync(join(outDir, 'baseline-random.json'), JSON.stringify(baseline, null, 2));
  console.log(
    `[measure] baseline random-uniform: ${baseline.successes}/20 succ, dMean=${baseline.finalDistanceMean.toFixed(3)}`,
  );

  const summary = { protocolId: PROTOCOL_ID, sha: SHA, machine, backend, results, baseline };
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`[measure] raw data written to ${outDir}`);
}

main().catch((error) => {
  console.error('[measure] failed:', error);
  process.exit(1);
});
