/**
 * GridWorld — Discrete NxN grid environment.
 *
 * - Agent starts at top-left corner (0, 0).
 * - Goal is at bottom-right corner (N-1, N-1).
 * - 4 discrete actions: 0=up, 1=down, 2=left, 3=right.
 * - Rewards:
 *     -0.01 per step (time penalty)
 *     +1.0  on reaching the goal
 *     -1.0  on attempting to walk into a wall (position unchanged)
 */

/** Callbacks that match IgnitionEnvConfig (minus the agent field). */
export interface EnvCallbacks {
  getObservation: () => number[];
  applyAction: (action: number | number[]) => void;
  computeReward: () => number;
  isDone: () => boolean;
  onReset: () => void;
  stepIntervalMs?: number;
}

export interface GridWorldConfig {
  /** Grid side length. Default: 5 */
  n?: number;
}

export class GridWorldEnv {
  private n: number;
  private row: number = 0;
  private col: number = 0;
  private lastReward: number = 0;
  private done: boolean = false;

  constructor(config: GridWorldConfig = {}) {
    this.n = config.n ?? 5;
  }

  /**
   * Observation: [row / (n-1), col / (n-1)] — both in [0, 1].
   * Special case n=1: returns [0, 0].
   */
  getObservation(): number[] {
    const scale = this.n > 1 ? this.n - 1 : 1;
    return [this.row / scale, this.col / scale];
  }

  /**
   * Apply one of the 4 directional actions.
   * Wall attempts leave the agent in place and return -1.0 reward.
   */
  applyAction(action: number | number[]): void {
    const a = Array.isArray(action) ? action[0] : action;
    let newRow = this.row;
    let newCol = this.col;

    switch (a) {
      case 0: newRow--; break; // up
      case 1: newRow++; break; // down
      case 2: newCol--; break; // left
      case 3: newCol++; break; // right
    }

    // Wall check
    if (newRow < 0 || newRow >= this.n || newCol < 0 || newCol >= this.n) {
      this.lastReward = -1.0;
      return; // position unchanged
    }

    this.row = newRow;
    this.col = newCol;

    // Goal check
    if (this.row === this.n - 1 && this.col === this.n - 1) {
      this.lastReward = 1.0;
      this.done = true;
    } else {
      this.lastReward = -0.01;
    }
  }

  computeReward(): number {
    return this.lastReward;
  }

  isDone(): boolean {
    return this.done;
  }

  onReset(): void {
    this.row = 0;
    this.col = 0;
    this.lastReward = 0;
    this.done = false;
  }

  /**
   * Returns the environment callbacks ready to spread into an IgnitionEnvConfig.
   * Usage: `new IgnitionEnv({ agent, ...env.getCallbacks() })`
   */
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

/** Factory: create a GridWorld of size n×n. */
export function createGridWorld(n: number = 5): GridWorldEnv {
  return new GridWorldEnv({ n });
}
