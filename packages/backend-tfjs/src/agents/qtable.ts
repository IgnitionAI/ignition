import { Experience } from '../memory/ReplayBuffer';
import { QTableConfig } from '../types';
import { QTableConfigSchema } from '../schemas';

export class QTableAgent {
  private config: QTableConfig;
  private qTable: Map<string, number[]>;
  private epsilon: number;

  constructor(config: QTableConfig) {
    const result = QTableConfigSchema.safeParse(config);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      throw new Error(`[QTableAgent] Invalid config: ${messages}`);
    }
    this.config = config;
    this.qTable = new Map();
    this.epsilon = config.epsilon;
  }

  private discretize(observation: number[]): string {
    const bins = this.config.numBins;
    const discretized = observation.map((v) => Math.floor(v * bins));
    return discretized.join(',');
  }

  private getQValues(stateKey: string): number[] {
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Array(this.config.actionSize).fill(0));
    }
    return this.qTable.get(stateKey)!;
  }

  async getAction(observation: number[]): Promise<number> {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.config.actionSize);
    }
    const stateKey = this.discretize(observation);
    const qValues = this.getQValues(stateKey);
    return qValues.indexOf(Math.max(...qValues));
  }

  remember(_experience: Experience): void {
    // Q-table update happens inline in train()
  }

  async train(): Promise<void> {
    // Stub: Q-table update step — would use last stored experience in a full implementation
  }
}
