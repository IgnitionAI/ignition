const FORCE = 0.001;
const GRAVITY = 0.0025;
const MIN_POS = -1.2;
const MAX_POS = 0.6;
const MIN_VEL = -0.07;
const MAX_VEL = 0.07;
const GOAL_POS = 0.5;
const MAX_STEPS = 200;

import type { TrainingEnv } from '@ignitionai/core';

export class MountainCarEnv implements TrainingEnv {
  actions = ['push_left', 'none', 'push_right'];
  position: number;
  velocity: number;
  stepCount = 0;

  constructor() {
    this.position = -0.5 + Math.random() * 0.2 - 0.1; // [-0.6, -0.4]
    this.velocity = 0;
  }

  observe(): number[] {
    return [this.position, this.velocity];
  }

  step(action: number | number[]): void {
    const a = typeof action === 'number' ? action : action[0];
    const force = (a - 1) * FORCE; // 0→-0.001, 1→0, 2→+0.001

    this.velocity += force - GRAVITY * Math.cos(3 * this.position);
    this.velocity = Math.max(MIN_VEL, Math.min(MAX_VEL, this.velocity));

    this.position += this.velocity;
    this.position = Math.max(MIN_POS, Math.min(MAX_POS, this.position));

    // If hit left wall, zero velocity
    if (this.position <= MIN_POS) this.velocity = 0;

    this.stepCount++;
  }

  reward(): number {
    return -1;
  }

  done(): boolean {
    return this.position >= GOAL_POS || this.stepCount >= MAX_STEPS;
  }

  reset(): void {
    this.position = -0.5 + Math.random() * 0.2 - 0.1;
    this.velocity = 0;
    this.stepCount = 0;
  }

  /** Valley height at a given position: sin(3x) */
  height(x: number): number {
    return Math.sin(3 * x);
  }
}
