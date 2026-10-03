/**
 * Q-Learning tabulaire — algorithme RL de base sans réseau de neurones.
 *
 * Principe :
 *   Q(s, a) ← Q(s, a) + α · [r + γ · max_{a'} Q(s', a') · (1−done) − Q(s, a)]
 *
 * L'espace d'états continu est discrétisé en bins par dimension.
 * La table Q est représentée par une Map<stateIndex, number[]>.
 *
 * Référence : Watkins & Dayan, "Q-Learning" (1992)
 */

import { AgentInterface, Experience, QTableConfig } from '../types';
import { QTableConfigSchema } from '../schemas';
import { z } from 'zod';

const checkpointSchema = z.object({
  config: QTableConfigSchema,
  qTable: z.array(z.tuple([z.number().int().nonnegative().safe(), z.array(z.number().finite())])),
  state: z.object({ epsilon: z.number().finite().min(0).max(1) }),
});

export class QTableAgent implements AgentInterface {
  /** Table Q : stateIndex → valeurs Q pour chaque action */
  private qTable: Map<number, number[]> = new Map();

  /** Dernière expérience stockée par remember(), consommée par train() */
  private lastExperience: Experience | null = null;

  private epsilon: number;

  private readonly lr: number;
  private readonly gamma: number;
  private readonly epsilonDecay: number;
  private readonly minEpsilon: number;
  private readonly actionSize: number;
  private readonly inputSize: number;
  private readonly stateBins: number;
  private readonly stateLow: number[];
  private readonly stateHigh: number[];

  constructor(config: QTableConfig) {
    const result = QTableConfigSchema.safeParse(config);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      throw new Error(`[QTableAgent] Invalid config: ${messages}`);
    }
    const {
      inputSize,
      actionSize,
      stateBins = 10,
      stateLow,
      stateHigh,
      lr = 0.1,
      gamma = 0.99,
      epsilon = 1.0,
      epsilonDecay = 0.995,
      minEpsilon = 0.01,
    } = config;

    this.inputSize = inputSize;
    this.actionSize = actionSize;
    this.stateBins = stateBins;
    this.stateLow = stateLow?.slice() ?? new Array(inputSize).fill(0);
    this.stateHigh = stateHigh?.slice() ?? new Array(inputSize).fill(1);
    this.lr = lr;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.epsilonDecay = epsilonDecay;
    this.minEpsilon = minEpsilon;
  }

  // -------------------------------------------------------------------------
  // Discrétisation
  // -------------------------------------------------------------------------

  /**
   * Convertit un vecteur d'état continu en un index entier unique.
   *
   * Chaque dimension est quantifiée en `stateBins` intervalles égaux,
   * puis combinée en représentation mixte-radix :
   *   index = bin_0 + stateBins·bin_1 + stateBins²·bin_2 + …
   *
   * Exemple (2D, stateBins=5) :
   *   [0.6, 0.2] → bin_0=3, bin_1=1 → index = 3 + 5·1 = 8
   */
  private stateToIndex(state: number[]): number {
    let index = 0;
    let multiplier = 1;
    for (let d = 0; d < this.inputSize; d++) {
      const lo = this.stateLow[d];
      const hi = this.stateHigh[d];
      const normalized = (state[d] - lo) / (hi - lo + 1e-9);
      const bin = Math.min(
        Math.max(0, Math.floor(normalized * this.stateBins)),
        this.stateBins - 1,
      );
      index += bin * multiplier;
      multiplier *= this.stateBins;
    }
    return index;
  }

  /**
   * Retourner (ou initialiser à zéro) les valeurs Q pour un état donné.
   */
  private getQ(stateIndex: number): number[] {
    if (!this.qTable.has(stateIndex)) {
      this.qTable.set(stateIndex, new Array(this.actionSize).fill(0));
    }
    return this.qTable.get(stateIndex)!;
  }

  // -------------------------------------------------------------------------
  // Interface AgentInterface
  // -------------------------------------------------------------------------

  /**
   * Sélectionner une action par politique epsilon-greedy.
   * Exploration : action aléatoire (prob. ε)
   * Exploitation : argmax Q(s, ·)
   */
  async getAction(state: number[], greedy?: boolean): Promise<number> {
    if (!greedy && Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }
    const idx = this.stateToIndex(state);
    const qValues = this.getQ(idx);
    // argmax Q(s, ·)
    return qValues.indexOf(Math.max(...qValues));
  }

  /**
   * Stocker l'expérience pour le prochain appel à train().
   */
  remember(experience: Experience): void {
    this.lastExperience = experience;
  }

  /**
   * Effectuer une mise à jour Q-Learning sur la dernière expérience.
   *
   * Q(s,a) ← Q(s,a) + α·[r + γ·max_{a'} Q(s',a')·(1−done) − Q(s,a)]
   *
   * Décroît epsilon après chaque update.
   */
  async train(): Promise<void> {
    if (!this.lastExperience) return;

    const { state, action, reward, nextState, terminated } = this.lastExperience;
    const done = terminated;
    const a = action as number;
    const sIdx = this.stateToIndex(state);
    const sNextIdx = this.stateToIndex(nextState);

    const currentQ = this.getQ(sIdx);
    const nextQ = this.getQ(sNextIdx);

    // Cible de Bellman
    const bellmanTarget = done
      ? reward
      : reward + this.gamma * Math.max(...nextQ);

    // Mise à jour en place
    currentQ[a] += this.lr * (bellmanTarget - currentQ[a]);

    this.lastExperience = null;

    // Décroissance de l'exploration
    if (this.epsilon > this.minEpsilon) {
      this.epsilon *= this.epsilonDecay;
    }
  }

  // -------------------------------------------------------------------------
  // Introspection
  // -------------------------------------------------------------------------

  /** Nombre d'états visités. */
  get tableSize(): number {
    return this.qTable.size;
  }

  /** Taux d'exploration courant. */
  get currentEpsilon(): number {
    return this.epsilon;
  }

  // ── Persistence ─────────────────────────────────────────────────────────

  getState(): Record<string, unknown> {
    return {
      epsilon: this.epsilon,
    };
  }

  setState(state: Record<string, unknown>): void {
    if (typeof state.epsilon === 'number') this.epsilon = state.epsilon;
  }

  /**
   * Serialize the Q-table to a JSON-compatible object.
   * Stores in localStorage under the given modelId.
   */
  async save(modelId: string, metadata?: Record<string, unknown>): Promise<string> {
    const payload = {
      qTable: Array.from(this.qTable.entries()),
      config: {
        inputSize: this.inputSize,
        actionSize: this.actionSize,
        stateBins: this.stateBins,
        stateLow: this.stateLow,
        stateHigh: this.stateHigh,
        lr: this.lr,
        gamma: this.gamma,
        epsilonDecay: this.epsilonDecay,
        minEpsilon: this.minEpsilon,
      },
      state: this.getState(),
      metadata,
      savedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(payload);
    localStorage.setItem(`ignition:qtable:${modelId}`, json);
    console.log(`[QTable] ✅ Saved to localStorage (ignition:qtable:${modelId})`);
    return `localstorage://qtable/${modelId}`;
  }

  async load(modelId: string): Promise<void> {
    const json = localStorage.getItem(`ignition:qtable:${modelId}`);
    if (!json) {
      throw new Error(`[QTable] No saved model found for "${modelId}"`);
    }
    const payload = checkpointSchema.parse(JSON.parse(json) as unknown);
    this.validateCheckpointConfig(payload.config);
    const table = new Map<number, number[]>();
    const stateCount = this.stateBins ** this.inputSize;
    for (const [key, values] of payload.qTable) {
      if (key >= stateCount || values.length !== this.actionSize || table.has(key)) {
        throw new Error('[QTable] Invalid checkpoint: state keys must be unique and in range, with actionSize Q-values.');
      }
      table.set(key, values);
    }
    this.qTable = table;
    this.epsilon = payload.state.epsilon;
    this.lastExperience = null;
  }

  private validateCheckpointConfig(config: QTableConfig): void {
    const low = config.stateLow ?? new Array<number>(config.inputSize).fill(0);
    const high = config.stateHigh ?? new Array<number>(config.inputSize).fill(1);
    const compatible = config.inputSize === this.inputSize && config.actionSize === this.actionSize
      && (config.stateBins ?? 10) === this.stateBins
      && low.every((value, index) => value === this.stateLow[index])
      && high.every((value, index) => value === this.stateHigh[index]);
    if (!compatible) {
      throw new Error('[QTable] Incompatible checkpoint: inputSize, actionSize, stateBins and bounds must match the current agent.');
    }
  }
}
