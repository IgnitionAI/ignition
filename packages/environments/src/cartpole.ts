const GRAVITY = 9.8;
const CART_MASS = 1.0;
const POLE_MASS = 0.1;
const TOTAL_MASS = CART_MASS + POLE_MASS;
const POLE_HALF_LENGTH = 0.5;
const POLE_MASS_LENGTH = POLE_MASS * POLE_HALF_LENGTH;
const FORCE_MAG = 10.0;
const DT = 0.02;
const THETA_LIMIT = 12 * (Math.PI / 180); // 12 degrees in radians
const X_LIMIT = 2.4;
const MAX_STEPS = 500;

export interface CartPoleState {
  x: number;
  xDot: number;
  theta: number;
  thetaDot: number;
  stepCount: number;
}

import type { TrainingEnv } from '@ignitionai/core';

export class CartPoleEnv implements TrainingEnv {
  actions = ['push_left', 'push_right'];
  state: CartPoleState;

  constructor() {
    this.state = this.randomInit();
  }

  private randomInit(): CartPoleState {
    return {
      x: (Math.random() - 0.5) * 0.1,
      xDot: (Math.random() - 0.5) * 0.1,
      theta: (Math.random() - 0.5) * 0.1,
      thetaDot: (Math.random() - 0.5) * 0.1,
      stepCount: 0,
    };
  }

  observe(): number[] {
    return [this.state.x, this.state.xDot, this.state.theta, this.state.thetaDot];
  }

  step(action: number | number[]): void {
    const a = typeof action === 'number' ? action : action[0];
    const force = a === 1 ? FORCE_MAG : -FORCE_MAG;

    const { x, xDot, theta, thetaDot } = this.state;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const temp = (force + POLE_MASS_LENGTH * thetaDot * thetaDot * sinTheta) / TOTAL_MASS;
    const thetaAcc =
      (GRAVITY * sinTheta - cosTheta * temp) /
      (POLE_HALF_LENGTH * (4 / 3 - (POLE_MASS * cosTheta * cosTheta) / TOTAL_MASS));
    const xAcc = temp - (POLE_MASS_LENGTH * thetaAcc * cosTheta) / TOTAL_MASS;

    // Euler integration
    this.state.x = x + DT * xDot;
    this.state.xDot = xDot + DT * xAcc;
    this.state.theta = theta + DT * thetaDot;
    this.state.thetaDot = thetaDot + DT * thetaAcc;
    this.state.stepCount++;
  }

  reward(): number {
    return this.done() ? 0 : 1;
  }

  done(): boolean {
    const { x, theta, stepCount } = this.state;
    if (Math.abs(theta) > THETA_LIMIT) return true;
    if (Math.abs(x) > X_LIMIT) return true;
    if (stepCount >= MAX_STEPS) return true;
    return false;
  }

  reset(): void {
    this.state = this.randomInit();
  }
}
