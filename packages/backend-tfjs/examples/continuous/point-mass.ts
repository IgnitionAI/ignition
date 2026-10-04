import { validateContinuousAction, validateContinuousBounds, type ContinuousTrainingEnv } from '@ignitionai/core';

/** The fixed physical task from sac-point-mass-v1; shared by the demo and benchmark. */
export class PointMassEnv implements ContinuousTrainingEnv {
  readonly actionSpace = { type: 'box' as const, shape: [1], low: [-2], high: [2] };
  private readonly bounds = validateContinuousBounds(this.actionSpace);
  private randomState: number;
  private position = 0;
  private velocity = 0;
  private ticks = 0;
  private lastReward = 0;
  private settledTicks = 0;

  constructor(seed = 11) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid point-mass seed');
    this.randomState = seed;
    this.reset();
  }
  private random(): number {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }
  observe(): number[] { return [this.position, this.velocity]; }
  reward(): number { return this.lastReward; }
  terminated(): boolean { return Math.abs(this.position) > 3; }
  truncated(): boolean { return !this.terminated() && this.ticks >= 100; }
  get success(): boolean { return this.truncated() && this.settledTicks >= 10; }
  get steps(): number { return this.ticks; }

  reset(): void {
    const magnitude = 0.4 + 0.6 * this.random();
    this.position = this.random() < 0.5 ? -magnitude : magnitude;
    this.velocity = -0.2 + 0.4 * this.random();
    this.ticks = 0; this.lastReward = 0; this.settledTicks = 0;
  }

  step(action: number[]): void {
    if (this.terminated() || this.truncated()) throw new Error('Reset the point-mass episode before stepping');
    const acceleration = validateContinuousAction(action, this.bounds)[0];
    this.velocity = (this.velocity + acceleration * 0.05) * 0.98;
    this.position += this.velocity * 0.05;
    this.ticks++;
    this.lastReward = -(this.position ** 2 + 0.1 * this.velocity ** 2 + 0.01 * acceleration ** 2)
      - (this.terminated() ? 10 : 0);
    this.settledTicks = Math.abs(this.position) <= 0.1 && Math.abs(this.velocity) <= 0.15
      ? this.settledTicks + 1 : 0;
  }
}
