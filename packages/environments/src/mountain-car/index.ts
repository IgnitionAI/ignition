/**
 * MountainCar — Continuous physics, discrete actions.
 *
 * A car sits in a valley and must build momentum to reach the right hill.
 *
 * State: [position, velocity]
 *   - position ∈ [-1.2, 0.6]
 *   - velocity ∈ [-0.07, 0.07]
 *
 * Actions: 0 = push left, 1 = no push, 2 = push right
 *
 * Reward:
 *   -1 per step (always)
 *    0 when the goal is reached (position >= 0.5)
 *
 * Episode ends:
 *   - Terminated: position >= 0.5 (goal reached)
 *   - Truncated:  after 200 steps
 *
 * Physics adapted from OpenAI Gym MountainCar-v0.
 */

export interface EnvCallbacks {
  getObservation: () => number[];
  applyAction: (action: number | number[]) => void;
  computeReward: () => number;
  isDone: () => boolean;
  onReset: () => void;
  stepIntervalMs?: number;
}

const MIN_POSITION = -1.2;
const MAX_POSITION = 0.6;
const MIN_SPEED = -0.07;
const MAX_SPEED = 0.07;
const GOAL_POSITION = 0.5;
const POWER = 0.001;
const GRAVITY = 0.0025;
const MAX_STEPS = 200;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class MountainCarEnv {
  private position: number = -0.5;
  private velocity: number = 0;
  private stepCount: number = 0;
  private lastReward: number = -1;
  private done: boolean = false;

  constructor() {
    this._initState();
  }

  private _initState(): void {
    // Start in [-0.6, -0.4] with zero velocity
    this.position = -0.6 + Math.random() * 0.2;
    this.velocity = 0;
    this.stepCount = 0;
    this.lastReward = -1;
    this.done = false;
  }

  getObservation(): number[] {
    return [this.position, this.velocity];
  }

  applyAction(action: number | number[]): void {
    if (this.done) return;

    const a = Array.isArray(action) ? action[0] : action;
    // Map action to force: 0→-1, 1→0, 2→+1
    const force = a - 1;

    this.velocity = clamp(
      this.velocity + force * POWER - Math.cos(3 * this.position) * GRAVITY,
      MIN_SPEED,
      MAX_SPEED,
    );
    this.position = clamp(this.position + this.velocity, MIN_POSITION, MAX_POSITION);

    // If the car hits the left wall, zero out leftward velocity
    if (this.position === MIN_POSITION && this.velocity < 0) {
      this.velocity = 0;
    }

    this.stepCount++;

    if (this.position >= GOAL_POSITION) {
      // Goal reached
      this.lastReward = 0;
      this.done = true;
    } else if (this.stepCount >= MAX_STEPS) {
      // Truncated
      this.lastReward = -1;
      this.done = true;
    } else {
      this.lastReward = -1;
    }
  }

  computeReward(): number {
    return this.lastReward;
  }

  isDone(): boolean {
    return this.done;
  }

  /** Returns the number of steps taken in the current episode. */
  getStepCount(): number {
    return this.stepCount;
  }

  onReset(): void {
    this._initState();
  }

  getCallbacks(): EnvCallbacks {
    return {
      getObservation: () => this.getObservation(),
      applyAction: (a) => this.applyAction(a),
      computeReward: () => this.computeReward(),
      isDone: () => this.isDone(),
      onReset: () => this.onReset(),
    };
  }
}

/** Factory: create a MountainCar environment. */
export function createMountainCar(): MountainCarEnv {
  return new MountainCarEnv();
}
