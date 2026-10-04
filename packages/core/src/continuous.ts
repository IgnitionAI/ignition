import type { BoxSpace } from './types';

/** A vector-action environment with explicit episode boundaries. */
export interface ContinuousTrainingEnv {
  actionSpace: BoxSpace;
  observe(): number[];
  step(action: number[]): void;
  reward(): number;
  terminated(): boolean;
  truncated(): boolean;
  reset(): void;
}

export interface ContinuousExperience {
  state: number[];
  action: number[];
  reward: number;
  nextState: number[];
  terminated: boolean;
  truncated: boolean;
}

export interface ContinuousAgent {
  getAction(observation: number[], greedy?: boolean): Promise<number[]>;
  remember(experience: ContinuousExperience): void;
  train(): Promise<void>;
  dispose(): void;
}

/** Immutable boundary snapshot, independent of caller-owned arrays. */
export interface ContinuousActionBounds {
  readonly low: readonly number[];
  readonly high: readonly number[];
  readonly size: number;
}

export function validateContinuousBounds(space: BoxSpace): ContinuousActionBounds {
  if (!space || space.type !== 'box' || !Array.isArray(space.shape)
    || space.shape.length !== 1 || !Number.isInteger(space.shape[0]) || space.shape[0] < 1
    || !Array.isArray(space.low) || !Array.isArray(space.high)
    || space.low.length !== space.shape[0] || space.high.length !== space.shape[0]) {
    throw new Error('[Continuous] Expected a nonempty one-dimensional BoxSpace');
  }
  for (let i = 0; i < space.shape[0]; i++) {
    const low = space.low[i], high = space.high[i];
    if (!Number.isFinite(low) || !Number.isFinite(high) || !(high > low)
      || !Number.isFinite(high - low)) {
      throw new Error('[Continuous] Action bounds must be finite and strictly increasing');
    }
  }
  return Object.freeze({
    low: Object.freeze([...space.low]), high: Object.freeze([...space.high]), size: space.shape[0],
  });
}

/** Returns a validated copy so callers cannot mutate the captured transition. */
export function validateContinuousVector(values: number[], size: number, label: string): number[] {
  if (!Number.isInteger(size) || size < 1 || !Array.isArray(values) || values.length !== size
    || Array.from(values).some(value => typeof value !== 'number' || !Number.isFinite(value))) {
    throw new Error(`[Continuous] ${label} must contain ${size} finite values`);
  }
  return [...values];
}

export function validateContinuousAction(action: number[], bounds: ContinuousActionBounds): number[] {
  const copy = validateContinuousVector(action, bounds.size, 'Action');
  if (copy.some((value, index) => value < bounds.low[index] || value > bounds.high[index])) {
    throw new Error('[Continuous] Action is outside its declared bounds');
  }
  return copy;
}

/** Validate the public environment before constructing a continuous runner. */
export function validateContinuousEnv(env: ContinuousTrainingEnv): {
  bounds: ContinuousActionBounds;
  observation: number[];
} {
  if (!env || ['observe', 'step', 'reward', 'terminated', 'truncated', 'reset']
    .some(method => typeof env[method as keyof ContinuousTrainingEnv] !== 'function')) {
    throw new Error('[Continuous] Missing environment method');
  }
  const bounds = validateContinuousBounds(env.actionSpace);
  const observation = env.observe();
  return { bounds, observation: validateContinuousVector(observation, observation?.length, 'Observation') };
}
