/**
 * QTableAgent — Tabular Q-learning.
 *
 * Suitable for discrete or low-dimensional continuous state spaces
 * (continuous values are discretized by rounding to 2 decimal places).
 *
 * Algorithm:
 *   Q(s, a) ← Q(s, a) + α [r + γ max_a' Q(s', a') - Q(s, a)]
 *
 * The agent implements AgentInterface: train() is called every step and
 * performs a single TD update from the last stored experience.
 */

import { Experience } from '../memory/ReplayBuffer';

export interface QTableConfig {
  actionSize: number;
  /** Learning rate α. Default: 0.1 */
  lr?: number;
  /** Discount factor γ. Default: 0.99 */
  gamma?: number;
  /** Initial exploration rate ε. Default: 1.0 */
  epsilon?: number;
  /** Multiplicative decay per train() call. Default: 0.995 */
  epsilonDecay?: number;
  /** Minimum exploration rate. Default: 0.01 */
  minEpsilon?: number;
}

export class QTableAgent {
  private table: Map<string, number[]> = new Map();
  private actionSize: number;
  private lr: number;
  private gamma: number;
  private epsilon: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private lastExperience: Experience | null = null;

  constructor(config: QTableConfig) {
    this.actionSize = config.actionSize;
    this.lr = config.lr ?? 0.1;
    this.gamma = config.gamma ?? 0.99;
    this.epsilon = config.epsilon ?? 1.0;
    this.epsilonDecay = config.epsilonDecay ?? 0.995;
    this.minEpsilon = config.minEpsilon ?? 0.01;
  }

  /**
   * Convert a state vector to a string key.
   * Values are rounded to 2 decimal places so that nearby continuous states
   * collapse to the same bucket (useful for GridWorld's [0, 0.25, 0.5…] states).
   */
  private stateToKey(state: number[]): string {
    return state.map(s => s.toFixed(2)).join(',');
  }

  /** Get Q-values for a state, initialising to zeros on first visit. */
  private getQ(state: number[]): number[] {
    const key = this.stateToKey(state);
    if (!this.table.has(key)) {
      this.table.set(key, new Array(this.actionSize).fill(0));
    }
    return this.table.get(key)!;
  }

  /** ε-greedy action selection. */
  async getAction(observation: number[]): Promise<number> {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }
    const q = this.getQ(observation);
    return q.indexOf(Math.max(...q));
  }

  /** Store the latest experience (only the last one is used for the TD update). */
  remember(experience: Experience): void {
    this.lastExperience = experience;
  }

  /**
   * One-step TD update using the last stored experience.
   * No-op if fewer than one experience has been collected.
   */
  async train(): Promise<void> {
    if (!this.lastExperience) return;

    const { state, action, reward, nextState, done } = this.lastExperience;

    const q = this.getQ(state);
    const nextQ = this.getQ(nextState);

    const target = done
      ? reward
      : reward + this.gamma * Math.max(...nextQ);

    q[action] += this.lr * (target - q[action]);

    if (this.epsilon > this.minEpsilon) {
      this.epsilon *= this.epsilonDecay;
    }
  }

  /** Number of states visited so far. */
  get tableSize(): number {
    return this.table.size;
  }

  /** Current exploration rate. */
  get currentEpsilon(): number {
    return this.epsilon;
  }
}
