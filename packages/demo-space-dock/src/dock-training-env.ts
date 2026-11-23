import type { TrainingEnv } from '@ignitionai/core';
import { ACTIONS } from './simulation-contract';
import type { SpaceDockEnv } from './space-dock-env';
import type { Telemetry } from './simulation-contract';

/**
 * Learning view of the space dock. The physics stays in SpaceDockEnv (Rapier, microgravity,
 * planar translation + yaw, 8 discrete actions at 10 Hz); this wrapper only defines the episode
 * (shorter horizon, collision as failure), a bounded dense reward and a deterministic seed sequence.
 */
export type TrainingOutcome = 'running' | 'success' | 'collision' | 'bounds' | 'nonfinite' | 'timeout';
export interface DockEpisode {
  seed: number; return: number; steps: number; outcome: Exclude<TrainingOutcome, 'running'>; distance: number;
}
export interface DockTrainingOptions {
  /** First episode seed; later reset() calls derive the next seeds deterministically. */
  seed?: number;
  /** Decisions (0.1 s each) before truncation. */
  maxSteps?: number;
  /** A new contact with a wall or module ends the episode as a failure. */
  terminateOnCollision?: boolean;
  /**
   * Training curriculum: start each episode with the cargo at rest on the docking axis, at a seeded
   * distance from the dock drawn uniformly in [min, max] metres. Omitted = the standard dock start.
   */
  startDistance?: readonly [number, number];
}
/**
 * Dense part = Φ(after) − Φ(before) − time, with the potential
 * Φ = −(progress·distance + alignment·(1 − cos yawError) + speed·min(1, cargoSpeed)·max(0, 1 − distance/nearRadius)).
 * A potential difference telescopes over an episode: it guides exploration without rewarding loops,
 * and the docking criterion itself (distance, yaw, speeds, 1.5 s hold) stays the one of SpaceDockEnv.
 */
export const REWARD = Object.freeze({
  progress: 2, alignment: 0.5, speed: 1, nearRadius: 3, time: 0.005,
  collision: 1, success: 10, failure: 10,
});
export const GOAL_X = 6;
/** Per-transition bounds: dense term clipped to [-1, 1], then collision and terminal terms. */
export const REWARD_BOUNDS = Object.freeze({
  min: -1 - REWARD.collision - REWARD.failure, max: 1 + REWARD.success,
});
/** Training-only start distances (m): from beside the dock to the standard start (about 13 m). */
export const TRAINING_CURRICULUM = Object.freeze([0.5, 13] as const);
export const TRAINING_ENV = Object.freeze({ seed: 2026, maxSteps: 300, observationSize: 26, actionCount: ACTIONS.length });

const TIME_INDEX = 16;
const clamp = (value: number, limit = 1) => Math.max(-limit, Math.min(limit, value));
function checkSeed(seed: number): number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('seed must be uint32');
  return seed;
}
export function potential(t: Telemetry): number {
  const speed = Math.hypot(t.cargo.velocity.x, t.cargo.velocity.z);
  return -(REWARD.progress * t.distance + REWARD.alignment * (1 - Math.cos(t.yawError))
    + REWARD.speed * Math.min(1, speed) * Math.max(0, 1 - t.distance / REWARD.nearRadius));
}
/** Episode n of a run seeded with `base` (n = 0 is the base itself). */
export function episodeSeed(base: number, index: number): number {
  return (base + Math.imul(index, 0x9e3779b1)) >>> 0;
}

export class DockTrainingEnv implements TrainingEnv {
  readonly actions = ACTIONS.length;
  readonly maxSteps: number;
  readonly terminateOnCollision: boolean;
  /** Curriculum range for the next reset() (see DockTrainingOptions.startDistance); undefined = standard start. */
  startDistance: readonly [number, number] | undefined;
  lastEpisode: DockEpisode | null = null;
  private baseSeed: number;
  private index = 0;
  private currentSeed: number;
  private stepCount = 0;
  private episodeReturn = 0;
  private lastReward = 0;
  private state: TrainingOutcome = 'running';
  private generation = -1;
  private ticks = -1;

  constructor(readonly dock: SpaceDockEnv, options: DockTrainingOptions = {}) {
    this.baseSeed = this.currentSeed = checkSeed(options.seed ?? TRAINING_ENV.seed);
    const maxSteps = options.maxSteps ?? TRAINING_ENV.maxSteps;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError('maxSteps must be a positive integer');
    this.maxSteps = maxSteps;
    this.terminateOnCollision = options.terminateOnCollision ?? true;
    const range = options.startDistance;
    if (range && !(range[0] >= 0 && range[1] >= range[0] && range[1] <= 14)) throw new RangeError('startDistance must satisfy 0 <= min <= max <= 14');
    this.startDistance = range && [range[0], range[1]];
  }

  get seed(): number { return this.currentSeed; }
  get steps(): number { return this.stepCount; }
  get outcome(): TrainingOutcome { return this.state; }
  get episodeReward(): number { return this.episodeReturn; }
  /** True when someone else reset or stepped the dock since this wrapper's last transition. */
  get stale(): boolean { return this.generation !== this.dock.generation || this.ticks !== this.dock.telemetry.ticks; }

  /** reset(seed) restarts the seed sequence at `seed`; reset() moves to the next episode seed. */
  reset(seed?: number): void {
    if (seed === undefined) { this.index++; this.currentSeed = episodeSeed(this.baseSeed, this.index); }
    else { this.baseSeed = this.currentSeed = checkSeed(seed); this.index = 0; }
    this.dock.reset(this.currentSeed);
    if (this.startDistance) {
      const [low, high] = this.startDistance;
      const unit = ((Math.imul(this.currentSeed ^ 0x5bd1e995, 1664525) + 1013904223) >>> 0) / 4294967296;
      this.dock.placeOnAxis(GOAL_X - (low + unit * (high - low)));
    }
    this.generation = this.dock.generation; this.ticks = this.dock.telemetry.ticks;
    this.stepCount = 0; this.episodeReturn = 0; this.lastReward = 0; this.state = 'running';
  }

  step(action: number | number[]): void {
    if (this.stale) throw new Error('dock was reset or stepped outside the training environment; reset() first');
    if (this.state !== 'running') return;
    const before = this.dock.telemetry;
    this.dock.step(action);
    const after = this.dock.telemetry;
    this.stepCount++; this.ticks = after.ticks;
    const contacts = after.contacts - before.contacts;
    this.state = after.outcome === 'success' || after.outcome === 'bounds' || after.outcome === 'nonfinite' ? after.outcome
      : contacts > 0 && this.terminateOnCollision ? 'collision'
      : after.outcome === 'timeout' || this.stepCount >= this.maxSteps ? 'timeout' : 'running';
    this.lastReward = this.shape(before, after, contacts);
    this.episodeReturn += this.lastReward;
    if (this.state !== 'running') {
      this.lastEpisode = { seed: this.currentSeed, return: this.episodeReturn, steps: this.stepCount,
        outcome: this.state, distance: after.distance };
    }
  }

  private shape(before: Telemetry, after: Telemetry, contacts: number): number {
    let dense = 0;
    if (this.state !== 'nonfinite') {
      dense = potential(after) - potential(before) - REWARD.time;
      if (!Number.isFinite(dense)) dense = 0;
    }
    return clamp(dense) - (contacts > 0 ? REWARD.collision : 0)
      + (this.state === 'success' ? REWARD.success
        : this.state === 'collision' || this.state === 'bounds' || this.state === 'nonfinite' ? -REWARD.failure : 0);
  }

  /** The 26 normalized dock observations; index 16 becomes the remaining share of this episode's horizon. */
  observe(): number[] {
    const observation = this.dock.observe();
    observation[TIME_INDEX] = clamp((this.maxSteps - this.stepCount) / this.maxSteps);
    return observation;
  }
  reward(): number { return this.lastReward; }
  done(): boolean { return this.state !== 'running'; }
  terminated(): boolean { return this.state !== 'running' && this.state !== 'timeout'; }
  truncated(): boolean { return this.state === 'timeout'; }
}
