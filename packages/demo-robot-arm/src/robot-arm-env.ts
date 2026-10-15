import type { TrainingEnv } from '@ignitionai/core';

/** Degrees → radians helper. */
export const DEG = Math.PI / 180;

/** Vertical axis is Y; shoulder pivot height in metres. */
export const PIVOT_Y = 0.6;
/** Upper arm length (m). */
export const L1 = 0.9;
/** Forearm length (m). */
export const L2 = 0.7;

/** Base yaw grid: [-90°, 90°] by 15° → 13 values. */
export const Q0_VALUES = Array.from({ length: 13 }, (_, i) => (-90 + 15 * i) * DEG);
/** Shoulder pitch grid: [15°, 75°] by 15° → 5 values. */
export const Q1_VALUES = Array.from({ length: 5 }, (_, i) => (15 + 15 * i) * DEG);
/** Elbow relative pitch grid: [-60°, 0°] by 15° → 5 values. */
export const Q2_VALUES = Array.from({ length: 5 }, (_, i) => (-60 + 15 * i) * DEG);

/** Total number of grid configurations: 13 × 5 × 5 = 325. */
export const GRID_SIZE = Q0_VALUES.length * Q1_VALUES.length * Q2_VALUES.length;

/** Success when the tip is within this distance of the target (m). */
export const SUCCESS_DISTANCE = 0.10;
/** Episode ends without success after this many commands. */
export const MAX_COMMANDS = 80;

export const ACTION_NAMES = ['base-', 'base+', 'shoulder-', 'shoulder+', 'elbow-', 'elbow+'] as const;
export const ACTION_COUNT = ACTION_NAMES.length;

/** Deterministic PRNG (mulberry32) so seeded resets are reproducible. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** A grid configuration, indices into the Q0/Q1/Q2 value arrays. */
export interface ArmConfig {
  q0: number;
  q1: number;
  q2: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Forward kinematics of the ideal 3-joint arm (contract robot-arm-v1).
 * r = L1·cos(q1) + L2·cos(q1+q2); x = r·sin(q0); y = 0.6 + L1·sin(q1) + L2·sin(q1+q2); z = r·cos(q0).
 */
export function forwardKinematics(q0: number, q1: number, q2: number): Vec3 {
  const r = L1 * Math.cos(q1) + L2 * Math.cos(q1 + q2);
  return {
    x: r * Math.sin(q0),
    y: PIVOT_Y + L1 * Math.sin(q1) + L2 * Math.sin(q1 + q2),
    z: r * Math.cos(q0),
  };
}

export function configToPosition(config: ArmConfig): Vec3 {
  return forwardKinematics(Q0_VALUES[config.q0], Q1_VALUES[config.q1], Q2_VALUES[config.q2]);
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Every valid grid configuration (325 entries, deterministic order). */
export function gridConfigs(): ArmConfig[] {
  const configs: ArmConfig[] = [];
  for (let q0 = 0; q0 < Q0_VALUES.length; q0++)
    for (let q1 = 0; q1 < Q1_VALUES.length; q1++)
      for (let q2 = 0; q2 < Q2_VALUES.length; q2++) configs.push({ q0, q1, q2 });
  return configs;
}

export function isValidConfig(config: ArmConfig): boolean {
  return (
    Number.isInteger(config.q0) && config.q0 >= 0 && config.q0 < Q0_VALUES.length &&
    Number.isInteger(config.q1) && config.q1 >= 0 && config.q1 < Q1_VALUES.length &&
    Number.isInteger(config.q2) && config.q2 >= 0 && config.q2 < Q2_VALUES.length
  );
}

/** Per-episode statistics, readable until the next reset. */
export interface EpisodeStats {
  commands: number;
  blocked: number;
  return: number;
  success: boolean;
  truncated: boolean;
  finalDistance: number;
  /** Commands used to succeed, null when the episode did not succeed. */
  commandsToSuccess: number | null;
}

const FRESH_STATS: EpisodeStats = {
  commands: 0,
  blocked: 0,
  return: 0,
  success: false,
  truncated: false,
  finalDistance: 0,
  commandsToSuccess: null,
};

/**
 * Robot-arm-v1: ideal kinematic arm on a 15° grid.
 * No gravity, no inertia, no collisions — the task is purely spatial:
 * reduce the distance between the tip and a fixed reachable target.
 */
export class RobotArmEnv implements TrainingEnv {
  readonly actions = [...ACTION_NAMES];

  private rng: () => number;
  private q0 = 0;
  private q1 = 0;
  private q2 = 0;
  private target: Vec3 = { x: 0, y: 0, z: 0 };
  private targetConfig: ArmConfig = { q0: 0, q1: 0, q2: 0 };
  private lastReward = 0;
  private lastBlocked = 0;
  private successFlag = false;
  private stats: EpisodeStats = { ...FRESH_STATS };

  /** Current tip position (rendering/HUD only, not part of observations). */
  readonly tip: Vec3 = { x: 0, y: 0, z: 0 };

  constructor(seed = 1) {
    if (!Number.isInteger(seed) || seed < 1) throw new Error('[RobotArmEnv] seed must be a positive integer');
    this.rng = createRng(seed);
    this.reset();
  }

  get angles(): { q0: number; q1: number; q2: number } {
    return { q0: Q0_VALUES[this.q0], q1: Q1_VALUES[this.q1], q2: Q2_VALUES[this.q2] };
  }

  get targetPosition(): Vec3 {
    return { ...this.target };
  }

  get targetConfigPosition(): ArmConfig {
    return { ...this.targetConfig };
  }

  get blockedLastCommand(): number {
    return this.lastBlocked;
  }

  get currentStats(): EpisodeStats {
    return { ...this.stats };
  }

  get config(): ArmConfig {
    return { q0: this.q0, q1: this.q1, q2: this.q2 };
  }

  /**
   * Start a new episode. If `target` is given it must be a valid grid config
   * (evaluation protocol); otherwise a reachable target is sampled from the grid.
   * The start configuration is sampled on the grid, strictly farther than
   * SUCCESS_DISTANCE from the target. All counters and the reward are zeroed.
   */
  reset(target?: ArmConfig): void {
    if (target !== undefined) {
      if (!isValidConfig(target)) throw new Error('[RobotArmEnv] invalid target config');
      this.targetConfig = { ...target };
    } else {
      const configs = gridConfigs();
      this.targetConfig = configs[Math.floor(this.rng() * configs.length)];
    }
    this.target = configToPosition(this.targetConfig);

    const configs = gridConfigs();
    let start = configs[Math.floor(this.rng() * configs.length)];
    let guard = 0;
    while (distance(configToPosition(start), this.target) <= SUCCESS_DISTANCE && guard < configs.length) {
      start = configs[Math.floor(this.rng() * configs.length)];
      guard++;
    }
    this.q0 = start.q0;
    this.q1 = start.q1;
    this.q2 = start.q2;

    const tip = this.computeTip();
    this.tip.x = tip.x;
    this.tip.y = tip.y;
    this.tip.z = tip.z;

    this.lastReward = 0;
    this.lastBlocked = 0;
    this.successFlag = false;
    this.stats = { ...FRESH_STATS, finalDistance: distance(this.tip, this.target) };
  }

  /** Force the arm onto a specific grid configuration (evaluation starts). */
  setConfig(config: ArmConfig): void {
    if (!isValidConfig(config)) throw new Error('[RobotArmEnv] invalid config');
    this.q0 = config.q0;
    this.q1 = config.q1;
    this.q2 = config.q2;
    const tip = this.computeTip();
    this.tip.x = tip.x;
    this.tip.y = tip.y;
    this.tip.z = tip.z;
    this.stats.finalDistance = distance(this.tip, this.target);
  }

  /**
   * One command moves exactly one joint by one grid step (15°).
   * At a grid limit the command is a no-op and counts as blocked.
   * Out-of-range action indices are explicitly refused.
   */
  step(action: number | number[]): void {
    const a = Array.isArray(action) ? action[0] : action;
    if (!Number.isInteger(a) || a < 0 || a >= ACTION_COUNT) {
      throw new Error(`[RobotArmEnv] invalid action ${JSON.stringify(a)} (expected integer 0..${ACTION_COUNT - 1})`);
    }
    if (this.done()) {
      throw new Error('[RobotArmEnv] step() called on a finished episode; call reset() first');
    }

    const d = distance(this.tip, this.target);
    let blocked = 0;

    const move = (value: number, min: number, max: number, delta: number): number => {
      const next = value + delta;
      if (next < min || next > max) {
        blocked = 1;
        return value;
      }
      return next;
    };

    switch (a) {
      case 0: this.q0 = move(this.q0, 0, Q0_VALUES.length - 1, -1); break;
      case 1: this.q0 = move(this.q0, 0, Q0_VALUES.length - 1, 1); break;
      case 2: this.q1 = move(this.q1, 0, Q1_VALUES.length - 1, -1); break;
      case 3: this.q1 = move(this.q1, 0, Q1_VALUES.length - 1, 1); break;
      case 4: this.q2 = move(this.q2, 0, Q2_VALUES.length - 1, -1); break;
      case 5: this.q2 = move(this.q2, 0, Q2_VALUES.length - 1, 1); break;
    }

    const tip = this.computeTip();
    this.tip.x = tip.x;
    this.tip.y = tip.y;
    this.tip.z = tip.z;

    const dNext = distance(this.tip, this.target);
    const success = dNext <= SUCCESS_DISTANCE ? 1 : 0;

    // Contract robot-arm-v1 — reward is a pure function of (d, d', blocked, success).
    this.lastReward = (2 * (d - dNext)) / 1.6 - (0.02 * dNext) / 1.6 - 0.01 - 0.02 * blocked + success;
    this.lastBlocked = blocked;

    if (success === 1) {
      this.successFlag = true;
      if (this.stats.commandsToSuccess === null) this.stats.commandsToSuccess = this.stats.commands;
    }

    this.stats.commands += 1;
    this.stats.blocked += blocked;
    this.stats.return += this.lastReward;
    this.stats.finalDistance = dNext;
    this.stats.success = this.successFlag;
    this.stats.truncated = this.stats.commands >= MAX_COMMANDS && !this.successFlag;
  }

  /**
   * Observations (6 values bounded in [-1, 1]):
   * [q0/90°, (q1-45°)/30°, (q2+30°)/30°, (target-tip).xyz/3.2].
   * The generating target config, camera and expert solution are not exposed.
   */
  observe(): number[] {
    return [
      Math.max(-1, Math.min(1, Q0_VALUES[this.q0] / (90 * DEG))),
      Math.max(-1, Math.min(1, (Q1_VALUES[this.q1] - 45 * DEG) / (30 * DEG))),
      Math.max(-1, Math.min(1, (Q2_VALUES[this.q2] + 30 * DEG) / (30 * DEG))),
      Math.max(-1, Math.min(1, (this.target.x - this.tip.x) / 3.2)),
      Math.max(-1, Math.min(1, (this.target.y - this.tip.y) / 3.2)),
      Math.max(-1, Math.min(1, (this.target.z - this.tip.z) / 3.2)),
    ];
  }

  /** Reward of the last command. Idempotent: reading never mutates state. */
  reward(): number {
    return this.lastReward;
  }

  /** True when the tip reached the target (terminal condition). */
  terminated(): boolean {
    return this.successFlag;
  }

  /** True after MAX_COMMANDS commands without success. */
  truncated(): boolean {
    return this.stats.commands >= MAX_COMMANDS && !this.successFlag;
  }

  done(): boolean {
    return this.terminated() || this.truncated();
  }

  private computeTip(): Vec3 {
    return forwardKinematics(Q0_VALUES[this.q0], Q1_VALUES[this.q1], Q2_VALUES[this.q2]);
  }
}
