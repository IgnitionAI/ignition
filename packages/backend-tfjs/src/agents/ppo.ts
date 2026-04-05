import { Experience } from '../memory/ReplayBuffer';
import { PPOConfig } from '../types';
import { PPOConfigSchema } from '../schemas';

export class PPOAgent {
  private config: PPOConfig;

  constructor(config: PPOConfig) {
    const result = PPOConfigSchema.safeParse(config);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      throw new Error(`[PPOAgent] Invalid config: ${messages}`);
    }
    this.config = config;
  }

  async getAction(_observation: number[]): Promise<number> {
    // Stub: random action in [0, actionSize)
    return Math.floor(Math.random() * this.config.actionSize);
  }

  remember(_experience: Experience): void {
    // Stub: collect experience for PPO rollout
  }

  async train(): Promise<void> {
    // Stub: PPO update step
  }
}
