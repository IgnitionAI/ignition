import RAPIER from '@dimforge/rapier3d-compat';
import type { TrainingEnv } from '@ignitionai/core';
import { BALL_RADIUS, GRAVITY, THRUST_INTERVAL, initialState, populateWorld, readState, thrust } from './physics';

/** Direction order shared by discrete actions and the eight horizontal sensors. */
export const ACTION_DIRECTIONS = [
  [0, 0], [0, -1], [1, -1], [1, 0], [1, 1],
  [0, 1], [-1, 1], [-1, 0], [-1, -1],
] as const;
export const ACTION_NAMES = ['no-op', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type EpisodeOutcome = 'running' | 'success' | 'failure' | 'timeout';
export interface EpisodeSummary {
  return: number;
  steps: number;
  outcome: EpisodeOutcome;
  seed: number;
  distance: number;
}

/** Owns the simulation; Rapier.init() must be awaited by the caller first. */
export class BallThrustEnv implements TrainingEnv {
  readonly actions = ACTION_NAMES.length;
  world!: RAPIER.World;
  ball!: RAPIER.RigidBody;
  goal!: { x: number; y: number; z: number };
  seed: number;
  steps = 0;
  episodeReturn = 0;
  lastAction = 0;
  lastReward = 0;
  lastEpisode: EpisodeSummary | null = null;
  outcome: EpisodeOutcome = 'running';
  private disposed = false;

  constructor(seed = 70) {
    this.seed = seed;
    this.reset(seed);
  }

  get telemetry() { return readState(this.ball, this.goal, this.steps * THRUST_INTERVAL); }

  reset(seed = this.seed): void {
    initialState(seed); // Validate before freeing the existing world.
    if (this.world && !this.disposed) {
      if (this.steps > 0 && !this.done()) this.lastEpisode = this.summary();
      this.world.free();
    }
    this.world = new RAPIER.World(GRAVITY);
    this.disposed = false;
    const { ball, goal } = populateWorld(this.world, RAPIER, seed);
    this.ball = ball;
    this.goal = goal;
    for (let tick = 0; tick < 120; tick++) this.world.step();
    this.seed = seed;
    this.steps = 0;
    this.episodeReturn = 0;
    this.lastAction = 0;
    this.lastReward = 0;
    this.outcome = 'running';
  }

  step(action: number | number[]): void {
    if (typeof action !== 'number' || !Number.isInteger(action) || action < 0 || action >= this.actions) {
      throw new RangeError('Action must be an integer from 0 to 8 (arrays are not supported).');
    }
    if (this.disposed) throw new Error('BallThrustEnv is disposed; reset before stepping.');
    if (this.done()) return;
    const oldDistance = this.telemetry.distance;
    this.lastAction = action;
    // Do not feed an already non-finite body to the WASM solver.
    if (!this.failed()) {
      thrust(this.ball, ACTION_DIRECTIONS[action], 0);
      for (let tick = 0; tick < THRUST_INTERVAL; tick++) this.world.step();
    }
    this.steps++;
    if (this.failed()) this.outcome = 'failure';
    else if (this.telemetry.reached) this.outcome = 'success';
    else if (this.steps >= 300) this.outcome = 'timeout';
    const progress = oldDistance - this.telemetry.distance;
    this.lastReward = 5 * (Number.isFinite(progress) ? progress : 0) - 0.01 - (action === 0 ? 0 : 0.001)
      + (this.outcome === 'success' ? 15 : this.outcome === 'failure' ? -15 : 0);
    this.episodeReturn += this.lastReward;
    if (this.done()) this.lastEpisode = this.summary();
  }

  /**
   * 0..1 x,z/6; 2..3 vx,vz/10; 4..5 goal delta x,z/12;
   * 6 height above radius/2; 7 vy/10; 8..10 angular xyz/25;
   * 11..18 N,NE,E,SE,S,SW,W,NW solid rays/4; 19..20 goal x,z/6.
   * All values finite and clipped to [-1,1]; rays clipped to [0,1].
   */
  observe(): number[] {
    const { position: p, velocity: v } = this.telemetry;
    const angular = this.ball.angvel();
    const rays = ACTION_DIRECTIONS.slice(1).map(([x, z]) => {
      if (![p.x, p.y, p.z].every(Number.isFinite)) return 1;
      const length = Math.hypot(x, z);
      const ray = new RAPIER.Ray(p, { x: x / length, y: 0, z: z / length });
      const hit = this.world.castRay(ray, 4, true, undefined, undefined, undefined, this.ball);
      return Math.max(0, Math.min(1, (hit?.timeOfImpact ?? 4) / 4));
    });
    return [
      p.x / 6, p.z / 6, v.x / 10, v.z / 10,
      (this.goal.x - p.x) / 12, (this.goal.z - p.z) / 12,
      (p.y - BALL_RADIUS) / 2, v.y / 10, angular.x / 25, angular.y / 25, angular.z / 25,
      ...rays, this.goal.x / 6, this.goal.z / 6,
    ].map((value) => Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0);
  }

  reward(): number { return this.lastReward; }
  done(): boolean { return this.outcome !== 'running'; }
  terminated(): boolean { return this.outcome === 'success' || this.outcome === 'failure'; }
  truncated(): boolean { return this.outcome === 'timeout'; }

  dispose(): void {
    if (!this.disposed) this.world.free();
    this.disposed = true;
  }

  private failed(): boolean {
    const p = this.ball.translation();
    const v = this.ball.linvel();
    const a = this.ball.angvel();
    const q = this.ball.rotation();
    return ![p.x, p.y, p.z, v.x, v.y, v.z, a.x, a.y, a.z, q.x, q.y, q.z, q.w].every(Number.isFinite)
      || Math.abs(p.x) > 6.1 || Math.abs(p.z) > 6.1 || p.y < -1 || p.y > 3;
  }

  private summary(): EpisodeSummary {
    return { return: this.episodeReturn, steps: this.steps, outcome: this.outcome,
      seed: this.seed, distance: this.telemetry.distance };
  }
}
