/**
 * CartPole — Classic balance environment (continuous physics, discrete actions).
 *
 * State: [cart_position, cart_velocity, pole_angle_rad, pole_angular_velocity]
 * Actions: 0 = push left, 1 = push right
 * Reward: +1 per step while the pole stays balanced
 * Terminated if:
 *   - |pole_angle| > 12° (0.2094 rad)
 *   - |cart_position| > 2.4
 *
 * Physics adapted from OpenAI Gym CartPole-v1.
 */

export interface EnvCallbacks {
  getObservation: () => number[];
  applyAction: (action: number | number[]) => void;
  computeReward: () => number;
  isDone: () => boolean;
  onReset: () => void;
  stepIntervalMs?: number;
}

// Physics constants
const GRAVITY = 9.8;
const MASS_CART = 1.0;
const MASS_POLE = 0.1;
const TOTAL_MASS = MASS_CART + MASS_POLE;
const HALF_POLE_LENGTH = 0.5;
const POLE_MASS_LENGTH = MASS_POLE * HALF_POLE_LENGTH;
const FORCE_MAG = 10.0;
const TAU = 0.02; // seconds per step

const THETA_THRESHOLD = 12 * (Math.PI / 180); // 12 degrees in radians
const X_THRESHOLD = 2.4;

export class CartPoleEnv {
  private x: number = 0;         // cart position
  private xDot: number = 0;     // cart velocity
  private theta: number = 0;    // pole angle (rad)
  private thetaDot: number = 0; // pole angular velocity
  private lastReward: number = 0;
  private done: boolean = false;

  constructor() {
    this._initState();
  }

  /** Small random start state, just like Gym. */
  private _initState(): void {
    this.x = (Math.random() - 0.5) * 0.1;
    this.xDot = (Math.random() - 0.5) * 0.1;
    this.theta = (Math.random() - 0.5) * 0.1;
    this.thetaDot = (Math.random() - 0.5) * 0.1;
    this.lastReward = 0;
    this.done = false;
  }

  getObservation(): number[] {
    return [this.x, this.xDot, this.theta, this.thetaDot];
  }

  applyAction(action: number | number[]): void {
    if (this.done) return;

    const a = Array.isArray(action) ? action[0] : action;
    const force = a === 1 ? FORCE_MAG : -FORCE_MAG;

    const cosTheta = Math.cos(this.theta);
    const sinTheta = Math.sin(this.theta);

    const temp = (force + POLE_MASS_LENGTH * this.thetaDot ** 2 * sinTheta) / TOTAL_MASS;
    const thetaAcc =
      (GRAVITY * sinTheta - cosTheta * temp) /
      (HALF_POLE_LENGTH * (4.0 / 3.0 - (MASS_POLE * cosTheta ** 2) / TOTAL_MASS));
    const xAcc = temp - (POLE_MASS_LENGTH * thetaAcc * cosTheta) / TOTAL_MASS;

    // Euler integration
    this.x += TAU * this.xDot;
    this.xDot += TAU * xAcc;
    this.theta += TAU * this.thetaDot;
    this.thetaDot += TAU * thetaAcc;

    const terminated =
      Math.abs(this.theta) > THETA_THRESHOLD ||
      Math.abs(this.x) > X_THRESHOLD;

    if (terminated) {
      this.done = true;
      this.lastReward = 0; // no reward on failure step
    } else {
      this.lastReward = 1.0;
    }
  }

  computeReward(): number {
    return this.lastReward;
  }

  isDone(): boolean {
    return this.done;
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

/** Factory: create a CartPole environment. */
export function createCartPole(): CartPoleEnv {
  return new CartPoleEnv();
}
