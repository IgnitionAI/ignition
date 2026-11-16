import {
  IgnitionEnv,
  type ActionSpace,
  type BoxSpace,
  type DiscreteSpace,
  type MultiDiscreteSpace,
  type ObservationSpace,
  type StepResult,
  type TrainingEnv,
} from '@ignitionai/core';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';

/**
 * Declared before any training run.
 *
 * Budget: 200 environment steps per seed (manual `step()`, not the async loop).
 * Seeds: 7, 11, 19. Algorithm: qtable. No convergence claim without measurement.
 */
export const TRAINING_BUDGET_STEPS = 200;
export const TRAINING_SEEDS = [7, 11, 19] as const;
export const TRAINING_OVERRIDES = {
  lr: 0.3,
  epsilon: 1,
  epsilonDecay: 0.99,
  minEpsilon: 0.05,
  stateBins: 8,
  stateLow: [0],
  stateHigh: [1],
} as const;

/** 1D line: start at 0, goal at `length - 1`, discrete left/right actions. */
export class LineWorldEnv implements TrainingEnv {
  actions = ['left', 'right'];
  position = 0;
  stepCount = 0;
  readonly length: number;
  readonly maxSteps: number;

  constructor(length = 5, maxSteps = 12) {
    this.length = length;
    this.maxSteps = maxSteps;
  }

  observe(): number[] {
    return [this.position / (this.length - 1)];
  }

  step(action: number | number[]): void {
    const a = typeof action === 'number' ? action : action[0];
    if (a === 1) {
      this.position = Math.min(this.length - 1, this.position + 1);
    } else {
      this.position = Math.max(0, this.position - 1);
    }
    this.stepCount += 1;
  }

  reward(): number {
    if (this.terminated()) return 1;
    return -0.01;
  }

  done(): boolean {
    return this.terminated() || this.truncated();
  }

  terminated(): boolean {
    return this.position === this.length - 1;
  }

  truncated(): boolean {
    return !this.terminated() && this.stepCount >= this.maxSteps;
  }

  reset(): void {
    this.position = 0;
    this.stepCount = 0;
  }

  actionSpace(): DiscreteSpace {
    return { type: 'discrete', n: this.actions.length };
  }

  observationSpace(): BoxSpace {
    return { type: 'box', low: [0], high: [1], shape: [1] };
  }
}

/** Missing `done()` — rejected by `validateTrainingEnv`. */
export function createInvalidTrainingEnv(): unknown {
  return {
    actions: ['left', 'right'],
    observe(): number[] {
      return [0];
    },
    step(): void {},
    reward(): number {
      return 0;
    },
    reset(): void {},
  };
}

export function spaceKind(space: ActionSpace | ObservationSpace): string {
  switch (space.type) {
    case 'discrete':
      return `discrete n=${(space as DiscreteSpace).n}`;
    case 'box':
      return `box shape=${(space as BoxSpace).shape.join('x')}`;
    case 'multidiscrete':
      return `multidiscrete nvec=${(space as MultiDiscreteSpace).nvec.join(',')}`;
    default: {
      const unexpected: never = space;
      throw new Error(`unhandled space: ${JSON.stringify(unexpected)}`);
    }
  }
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TrainingRunMeasurement {
  seed: number;
  budgetSteps: number;
  completedSteps: number;
  terminatedEpisodes: number;
  truncatedEpisodes: number;
  episodeReturns: number[];
}

export async function runLineWorldTraining(
  seed: number,
  budgetSteps: number = TRAINING_BUDGET_STEPS,
): Promise<TrainingRunMeasurement> {
  const rng = mulberry32(seed);
  const originalRandom = Math.random;
  Math.random = rng;
  const world = new LineWorldEnv();
  const runner = new IgnitionEnvTFJS(world);
  try {
    runner.train('qtable', { ...TRAINING_OVERRIDES });
    runner.stop();
    const episodeReturns: number[] = [];
    let episodeReturn = 0;
    let terminatedEpisodes = 0;
    let truncatedEpisodes = 0;
    let completedSteps = 0;
    for (let i = 0; i < budgetSteps; i++) {
      const result: StepResult = await runner.step();
      completedSteps += 1;
      episodeReturn += result.reward;
      if (result.terminated || result.truncated) {
        if (result.terminated) terminatedEpisodes += 1;
        if (result.truncated) truncatedEpisodes += 1;
        episodeReturns.push(episodeReturn);
        episodeReturn = 0;
      }
    }
    return {
      seed,
      budgetSteps,
      completedSteps,
      terminatedEpisodes,
      truncatedEpisodes,
      episodeReturns,
    };
  } finally {
    runner.stop();
    runner.agent?.dispose?.();
    Math.random = originalRandom;
  }
}

/** Scripted always-right agent for episode-end semantics (real `IgnitionEnv.step`). */
export async function scriptedStep(world: TrainingEnv): Promise<StepResult> {
  const runner = new IgnitionEnv(world);
  runner.agent = {
    getAction: async () => 1,
    remember() {},
    train: async () => {},
  };
  return runner.step();
}
