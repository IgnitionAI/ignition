import type { TrainingEnv } from '@ignitionai/core';
import { ACTIONS } from './simulation-contract';
import type { SpaceDockEnv } from './space-dock-env';
import type { Telemetry } from './simulation-contract';

/**
 * Learning view of the IGN-118 dock. The physics stays in SpaceDockEnv (Rapier, microgravity,
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
}
export const REWARD = Object.freeze({
  progress: 2, alignment: 0.5, nearSpeed: 0.1, nearRadius: 2, time: 0.005,
  collision: 1, success: 10, failure: 10,
});
/** Per-transition bounds: dense term clipped to [-1, 1], then collision and terminal terms. */
export const REWARD_BOUNDS = Object.freeze({
  min: -1 - REWARD.collision - REWARD.failure, max: 1 + REWARD.success,
});
export const TRAINING_ENV = Object.freeze({ seed: 2026, maxSteps: 300, observationSize: 26, actionCount: ACTIONS.length });

const TIME_INDEX = 16;
const clamp = (value: number, limit = 1) => Math.max(-limit, Math.min(limit, value));
function checkSeed(seed: number): number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('seed must be uint32');
  return seed;
}
/** Episode n of a run seeded with `base` (n = 0 is the base itself). */
export function episodeSeed(base: number, index: number): number {
  return (base + Math.imul(index, 0x9e3779b1)) >>> 0;
}

export class DockTrainingEnv implements TrainingEnv {
  readonly actions = ACTIONS.length;
  readonly maxSteps: number;
  readonly terminateOnCollision: boolean;
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
      const speed = Math.hypot(after.cargo.velocity.x, after.cargo.velocity.z);
      dense = REWARD.progress * (before.distance - after.distance)
        + REWARD.alignment * (Math.cos(after.yawError) - Math.cos(before.yawError))
        - (after.distance < REWARD.nearRadius ? REWARD.nearSpeed * Math.min(1, speed) : 0) - REWARD.time;
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
