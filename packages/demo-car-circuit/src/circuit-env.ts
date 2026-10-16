import type { TrainingEnv } from '@ignitionai/core';
import { OvalTrack } from './track';

const SPEED = 0.15;
const STEER_DELTA = 0.08; // radians per step
const MAX_STEPS = 500;
export const SIMULATION_STEP_SECONDS = 0.05;

export interface CircuitOptions {
  maxSteps?: number;
  targetLaps?: number;
  startWaypoint?: number;
}

export interface CircuitEpisode {
  transitions: number;
  completedLaps: number;
  lapTimesSeconds: number[];
  simulationSeconds: number;
  endReason: 'success' | 'off-track' | 'time-limit';
}

const LAP_BONUS = 50;
const OFF_TRACK_PENALTY = -10;
const LAPS_TO_WIN = 3;

// Reward shaping weights
const PROGRESS_WEIGHT = 300;     // dense — one full lap ≈ +300
const ALIGNMENT_WEIGHT = 0.3;    // reward facing track direction
const CENTERLINE_WEIGHT = 0.2;   // small reward for staying near middle

export class CircuitEnv implements TrainingEnv {
  actions = ['steer_left', 'straight', 'steer_right'];

  readonly track: OvalTrack;
  carX: number;
  carY: number;
  carAngle: number;
  stepCount = 0;
  laps = 0;
  private lastProgress = 0;
  private readonly maxSteps: number;
  private readonly targetLaps: number;
  private readonly startWaypoint: number;
  private forwardProgress = 0;
  private lastLapStep = 0;
  private lapTimesSeconds: number[] = [];
  /** Most recent completed episode; retained across automatic resets. */
  lastEpisode: CircuitEpisode | null = null;
  private offTrack = false;
  private justCompletedLap = false;

  // Per-step shaping signals, computed in step() and read in reward()
  private progressDelta = 0;
  private alignment = 0;
  private lateralNorm = 0;

  constructor(straightLen = 10, radius = 4, halfWidth = 2, options: CircuitOptions = {}) {
    this.track = new OvalTrack(straightLen, radius, halfWidth);
    this.maxSteps = options.maxSteps ?? MAX_STEPS;
    this.targetLaps = options.targetLaps ?? LAPS_TO_WIN;
    this.startWaypoint = options.startWaypoint ?? 0;
    if (!Number.isInteger(this.maxSteps) || this.maxSteps < 1 ||
        !Number.isInteger(this.targetLaps) || this.targetLaps < 1 ||
        !Number.isInteger(this.startWaypoint) || this.startWaypoint < 0 ||
        this.startWaypoint >= this.track.waypoints.length - 1) {
      throw new Error('Invalid Circuit episode options');
    }
    const start = this.track.waypoints[this.startWaypoint];
    this.carX = start.x;
    this.carY = start.y;
    this.carAngle = this.track.nearestPoint(start.x, start.y).trackAngle;
    this.lastProgress = this.track.nearestPoint(start.x, start.y).progress;
  }

  observe(): number[] {
    const result = this.track.nearestPoint(this.carX, this.carY);
    const angleDiff = this.normalizeAngle(this.carAngle - result.trackAngle);

    return [
      result.signedDistance / this.track.halfWidth,  // [-1, 1] when on track
      angleDiff / Math.PI,                            // [-1, 1]
      (this.track.halfWidth - result.signedDistance) / (2 * this.track.halfWidth), // dist to "left"
      (this.track.halfWidth + result.signedDistance) / (2 * this.track.halfWidth), // dist to "right"
      result.progress,                                // [0, 1]
    ];
  }

  step(action: number | number[]): void {
    const a = typeof action === 'number' ? action : action[0];

    // Steering
    if (a === 0) this.carAngle += STEER_DELTA;       // left
    else if (a === 2) this.carAngle -= STEER_DELTA;  // right
    // a === 1: straight, no change

    // Move forward
    this.carX += SPEED * Math.cos(this.carAngle);
    this.carY += SPEED * Math.sin(this.carAngle);

    // Check track status
    this.offTrack = !this.track.isOnTrack(this.carX, this.carY);

    const result = this.track.nearestPoint(this.carX, this.carY);

    // Progress delta with wraparound handling.
    // When the car crosses the start line, progress jumps from ~0.99 → ~0.01
    // (or vice-versa going backward). Unwrap so the delta reflects actual motion.
    let delta = result.progress - this.lastProgress;
    if (delta < -0.5) delta += 1;  // wrapped forward (lap completed)
    if (delta > 0.5) delta -= 1;   // wrapped backward (unusual)
    this.progressDelta = delta;

    // Alignment with track direction. cos(0) = 1 (perfect), cos(π) = -1 (backwards).
    const angleDiff = this.normalizeAngle(this.carAngle - result.trackAngle);
    this.alignment = Math.cos(angleDiff);

    // Lateral distance normalized to [-1, 1]
    this.lateralNorm = result.signedDistance / this.track.halfWidth;

    // Lap completion — fire bonus only once per crossing
    this.justCompletedLap = false;
    this.forwardProgress += delta;
    if (!this.offTrack && this.forwardProgress >= this.laps + 1 - 1e-9) {
      this.laps++;
      this.justCompletedLap = true;
      this.lapTimesSeconds.push((this.stepCount + 1 - this.lastLapStep) * SIMULATION_STEP_SECONDS);
      this.lastLapStep = this.stepCount + 1;
    }
    this.lastProgress = result.progress;

    this.stepCount++;
  }

  reward(): number {
    if (this.offTrack) return OFF_TRACK_PENALTY;

    // Dense progress reward: the agent is rewarded for *moving forward* along
    // the track, not just for staying alive on it. Running backward or standing
    // still produces ~0 or negative reward, forcing the agent to learn direction.
    const base =
      this.progressDelta * PROGRESS_WEIGHT +
      this.alignment * ALIGNMENT_WEIGHT +
      (1 - Math.abs(this.lateralNorm)) * CENTERLINE_WEIGHT;

    return this.justCompletedLap ? base + LAP_BONUS : base;
  }

  terminated(): boolean {
    return this.offTrack || this.laps >= this.targetLaps;
  }

  truncated(): boolean {
    return !this.terminated() && this.stepCount >= this.maxSteps;
  }

  done(): boolean {
    return this.terminated() || this.truncated();
  }

  reset(): void {
    if (this.done()) {
      this.lastEpisode = {
        transitions: this.stepCount, completedLaps: this.laps,
        lapTimesSeconds: [...this.lapTimesSeconds],
        simulationSeconds: this.stepCount * SIMULATION_STEP_SECONDS,
        endReason: this.offTrack ? 'off-track' : this.laps >= this.targetLaps ? 'success' : 'time-limit',
      };
    }
    const start = this.track.waypoints[this.startWaypoint];
    this.carX = start.x;
    this.carY = start.y;
    this.carAngle = this.track.nearestPoint(start.x, start.y).trackAngle;
    this.stepCount = 0;
    this.laps = 0;
    this.lastProgress = this.track.nearestPoint(start.x, start.y).progress;
    this.forwardProgress = 0;
    this.lastLapStep = 0;
    this.lapTimesSeconds = [];
    this.offTrack = false;
    this.justCompletedLap = false;
    this.progressDelta = 0;
    this.alignment = 0;
    this.lateralNorm = 0;
  }

  private normalizeAngle(a: number): number {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }
}
