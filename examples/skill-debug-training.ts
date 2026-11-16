/**
 * CartPole debug protocol for skill ignition-debug-training.
 *
 * PROTOCOL A (declared before first run):
 *   SEEDS, TRAIN_STEPS, network as below, BROKEN_LR = 1, FIXED_LR = 0.001
 *   Result: DQNConfigSchema rejects lr >= 1 ("lr must be < 1"). No training.
 *
 * PROTOCOL B (declared after A, before any Protocol B run):
 *   SEEDS            = [7, 11, 19]
 *   TRAIN_STEPS      = 64
 *   hiddenLayers     = [8]
 *   batchSize        = 8
 *   memorySize       = 64
 *   targetUpdateFrequency = 100
 *   backend          = 'cpu'
 *   lr               = 0.001
 *   BROKEN_OBS_SCALE = 1000
 *   FIXED_OBS_SCALE  = 1
 *
 * Hypothesis B: multiplying CartPole observations by 1000 yields non-finite
 * Q-values (or non-finite rewards/obs) on every seed; scale 1 keeps Q finite.
 * Result B: Q stayed finite (seed 7 qSample ≈ [79.4, 104.6], meanReturn 12).
 *
 * PROTOCOL C (declared after B, before any Protocol C run):
 *   Same seeds, TRAIN_STEPS, network, backend, FIXED_OBS_SCALE = 1
 *   BROKEN_LR = 0.99 (legal: schema requires lr < 1)
 *   FIXED_LR  = 0.001
 * Hypothesis C: lr 0.99 makes Q non-finite on every seed; lr 0.001 keeps Q finite.
 * Result C: Q stayed finite on seeds 7/11/19 (see test log). Not a NaN failure.
 *
 * PROTOCOL D (declared after C, before any Protocol D run):
 *   Same seeds, TRAIN_STEPS = 64, network, backend, lr = 0.001, obs scale = 1
 *   Broken: TrainingEnv.reward() always returns 0 (flat reward on CartPole physics)
 *   Fixed: CartPoleEnv.reward() (1 while up, 0 on done)
 * Hypothesis D: broken meanReturn is 0 on every seed; fixed meanReturn is > 0.
 * No claim that the pole is solved.
 */
import { CartPoleEnv } from '@ignitionai/environments';
import { DQNAgent, IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import type { TrainingEnv } from '@ignitionai/core';
// Root vitest aliases @ignitionai/* only. Resolve TF.js from the backend workspace package.
import * as tf from '../packages/backend-tfjs/node_modules/@tensorflow/tfjs';

export const SEEDS = [7, 11, 19] as const;
export const TRAIN_STEPS = 64;
export const TENSOR_STABLE_STEPS = 24;
export const TRAIN_LR = 0.001;
export const BROKEN_LR = 0.99;
export const BROKEN_OBS_SCALE = 1;
export const FIXED_OBS_SCALE = 1;
export const REJECTED_LR = 1;
export type RewardMode = 'cartpole' | 'zero';

export const SHARED_DQN_OVERRIDES = {
  backend: 'cpu' as const,
  hiddenLayers: [8],
  batchSize: 8,
  memorySize: 64,
  targetUpdateFrequency: 100,
  epsilon: 1,
  epsilonDecay: 0.995,
  minEpsilon: 0.01,
  gamma: 0.99,
};

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** CartPole with seeded resets. Agent `seed` does not control CartPoleEnv.reset(). */
export class SeededCartPole implements TrainingEnv {
  readonly inner = new CartPoleEnv();
  readonly actions = this.inner.actions;
  private readonly random: () => number;
  private readonly observationScale: number;
  private readonly rewardMode: RewardMode;

  constructor(
    seed: number,
    observationScale = 1,
    rewardMode: RewardMode = 'cartpole',
  ) {
    this.random = mulberry32(seed ^ 0x9e3779b9);
    this.observationScale = observationScale;
    this.rewardMode = rewardMode;
    this.reset();
  }

  observe(): number[] {
    return this.inner.observe().map((x) => x * this.observationScale);
  }

  step(action: number | number[]): void {
    this.inner.step(action);
  }

  reward(): number {
    switch (this.rewardMode) {
      case 'zero':
        return 0;
      case 'cartpole':
        return this.inner.reward();
      default: {
        const exhaustive: never = this.rewardMode;
        throw new Error(`unhandled rewardMode: ${String(exhaustive)}`);
      }
    }
  }

  done(): boolean {
    return this.inner.done();
  }

  reset(): void {
    this.inner.reset();
    this.inner.state = {
      x: (this.random() - 0.5) * 0.1,
      xDot: (this.random() - 0.5) * 0.1,
      theta: (this.random() - 0.5) * 0.1,
      thetaDot: (this.random() - 0.5) * 0.1,
      stepCount: 0,
    };
  }
}

export interface TrialResult {
  seed: number;
  lr: number;
  observationScale: number;
  rewardMode: RewardMode;
  steps: number;
  episodes: number;
  meanReturn: number;
  maxReturn: number;
  minReturn: number;
  finiteRewards: boolean;
  finiteObservations: boolean;
  qFinite: boolean;
  qSample: number[];
  epsilon: number | null;
  trainStepCounter: number | null;
  tensorsAfterWarmup: number | null;
  tensorsAfterStableWindow: number | null;
  tensorDelta: number | null;
}

export function probeQValues(agent: DQNAgent, observation: number[]): number[] {
  return tf.tidy(() => {
    const input = tf.tensor2d([observation]);
    const out = agent.getModel().predict(input) as tf.Tensor;
    return Array.from(out.dataSync());
  });
}

export function valuesAreFinite(xs: number[]): boolean {
  return xs.every((x) => Number.isFinite(x));
}

export async function runTrial(
  seed: number,
  observationScale: number,
  lr = TRAIN_LR,
  rewardMode: RewardMode = 'cartpole',
): Promise<TrialResult> {
  await tf.setBackend('cpu');
  await tf.ready();

  const pole = new SeededCartPole(seed, observationScale, rewardMode);
  const env = new IgnitionEnvTFJS(pole);
  const episodeReturns: number[] = [];
  let current = 0;
  let finiteRewards = true;
  let finiteObservations = true;
  let tensorsAfterWarmup: number | null = null;
  let tensorsAfterStableWindow: number | null = null;

  env.train('dqn', {
    ...SHARED_DQN_OVERRIDES,
    lr,
    seed,
  });
  env.stop();

  try {
    for (let i = 0; i < TRAIN_STEPS; i++) {
      const result = await env.step();
      if (!Number.isFinite(result.reward)) finiteRewards = false;
      if (!valuesAreFinite(result.observation)) finiteObservations = false;
      current += result.reward;
      if (result.terminated || result.truncated) {
        episodeReturns.push(current);
        current = 0;
      }
      if (i + 1 === SHARED_DQN_OVERRIDES.batchSize) {
        tensorsAfterWarmup = tf.memory().numTensors;
      }
      if (
        tensorsAfterWarmup !== null &&
        i + 1 === SHARED_DQN_OVERRIDES.batchSize + TENSOR_STABLE_STEPS
      ) {
        tensorsAfterStableWindow = tf.memory().numTensors;
      }
    }
    if (current > 0 || episodeReturns.length === 0) {
      episodeReturns.push(current);
    }

    const agent = env.agent as DQNAgent;
    const qSample = probeQValues(agent, pole.observe());
    const state = agent.getState();
    const epsilon = typeof state.epsilon === 'number' ? state.epsilon : null;
    const trainStepCounter =
      typeof state.trainStepCounter === 'number' ? state.trainStepCounter : null;
    const meanReturn =
      episodeReturns.reduce((a, b) => a + b, 0) / episodeReturns.length;

    return {
      seed,
      lr,
      observationScale,
      rewardMode,
      steps: TRAIN_STEPS,
      episodes: episodeReturns.length,
      meanReturn,
      maxReturn: Math.max(...episodeReturns),
      minReturn: Math.min(...episodeReturns),
      finiteRewards,
      finiteObservations,
      qFinite: valuesAreFinite(qSample),
      qSample,
      epsilon,
      trainStepCounter,
      tensorsAfterWarmup,
      tensorsAfterStableWindow,
      tensorDelta:
        tensorsAfterWarmup === null || tensorsAfterStableWindow === null
          ? null
          : tensorsAfterStableWindow - tensorsAfterWarmup,
    };
  } finally {
    env.stop();
    env.agent?.dispose?.();
  }
}

export async function runDeclaredProtocol(): Promise<{
  broken: TrialResult[];
  fixed: TrialResult[];
}> {
  const broken: TrialResult[] = [];
  const fixed: TrialResult[] = [];
  for (const seed of SEEDS) {
    broken.push(await runTrial(seed, FIXED_OBS_SCALE, TRAIN_LR, 'zero'));
  }
  for (const seed of SEEDS) {
    fixed.push(await runTrial(seed, FIXED_OBS_SCALE, TRAIN_LR, 'cartpole'));
  }
  return { broken, fixed };
}

export function tryRejectedLearningRate(): string {
  const env = new IgnitionEnvTFJS(new SeededCartPole(SEEDS[0], FIXED_OBS_SCALE));
  try {
    env.train('dqn', { ...SHARED_DQN_OVERRIDES, lr: REJECTED_LR, seed: SEEDS[0] });
    env.stop();
    env.agent?.dispose?.();
    return 'NO_THROW';
  } catch (error) {
    env.stop();
    return error instanceof Error ? error.message : String(error);
  }
}

export async function measureTensorStability(seed: number): Promise<{
  before: number;
  after: number;
  delta: number;
}> {
  await tf.setBackend('cpu');
  await tf.ready();
  const env = new IgnitionEnvTFJS(new SeededCartPole(seed, FIXED_OBS_SCALE));
  env.train('dqn', { ...SHARED_DQN_OVERRIDES, lr: TRAIN_LR, seed });
  env.stop();
  try {
    for (let i = 0; i < SHARED_DQN_OVERRIDES.batchSize; i++) {
      await env.step();
    }
    const before = tf.memory().numTensors;
    for (let i = 0; i < TENSOR_STABLE_STEPS; i++) {
      await env.step();
    }
    const after = tf.memory().numTensors;
    return { before, after, delta: after - before };
  } finally {
    env.stop();
    env.agent?.dispose?.();
  }
}
