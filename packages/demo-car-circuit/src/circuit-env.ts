import type { TrainingEnv } from '@ignitionai/core';
import { OvalTrack } from './track';

const SPEED = 0.15;
const STEER_DELTA = 0.08; // radians per step
const MAX_STEPS = 500;
const LAP_BONUS = 50;
const OFF_TRACK_PENALTY = -10;
const LAPS_TO_WIN = 3;

export class CircuitEnv implements TrainingEnv {
  actions = ['steer_left', 'straight', 'steer_right'];

  readonly track: OvalTrack;
  carX: number;
  carY: number;
  carAngle: number;
  stepCount = 0;
  laps = 0;
  private lastProgress = 0;
  private offTrack = false;

  constructor(straightLen = 10, radius = 4, halfWidth = 2) {
    this.track = new OvalTrack(straightLen, radius, halfWidth);
    // Start on top straight, facing right
    const start = this.track.waypoints[0];
    this.carX = start.x;
    this.carY = start.y;
    this.carAngle = 0;
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

    // Check lap completion
    const result = this.track.nearestPoint(this.carX, this.carY);
    if (result.progress < 0.1 && this.lastProgress > 0.9) {
      this.laps++;
    }
    this.lastProgress = result.progress;

    this.stepCount++;
  }

  reward(): number {
    if (this.offTrack) return OFF_TRACK_PENALTY;
    if (this.laps > 0 && this.lastProgress < 0.1) return LAP_BONUS;
    return 1; // +1 per step on track
  }

  done(): boolean {
    if (this.offTrack) return true;
    if (this.laps >= LAPS_TO_WIN) return true;
    return this.stepCount >= MAX_STEPS;
  }

  reset(): void {
    const start = this.track.waypoints[0];
    this.carX = start.x;
    this.carY = start.y;
    this.carAngle = 0;
    this.stepCount = 0;
    this.laps = 0;
    this.lastProgress = 0;
    this.offTrack = false;
  }

  private normalizeAngle(a: number): number {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }
}
