import { IgnitionEnv, type IgnitionEnvConfig, type AgentFactory } from '@ignitionai/core';
import { DQNAgent } from './agents/dqn';
import { PPOAgent } from './agents/ppo';
import { QTableAgent } from './agents/qtable';
import { ALGORITHM_DEFAULTS } from './defaults';
import type { DQNConfig, PPOConfig, QTableConfig } from './types';

const FACTORIES: Record<string, AgentFactory> = {
  dqn: (config) => new DQNAgent(config as unknown as DQNConfig),
  ppo: (config) => new PPOAgent(config as unknown as PPOConfig),
  qtable: (config) => new QTableAgent(config as unknown as QTableConfig),
};

/**
 * IgnitionEnv with TF.js agent factories baked in.
 *
 * Import this from `@ignitionai/backend-tfjs` instead of `@ignitionai/core`
 * to get auto-configuration support:
 *
 * ```ts
 * import { IgnitionEnv } from '@ignitionai/backend-tfjs';
 *
 * const env = new IgnitionEnv({
 *   getObservation: () => [x, y],
 *   actions: ['left', 'right'],
 *   applyAction: (a) => { ... },
 *   computeReward: () => reward,
 *   isTerminated: () => done,
 * });
 *
 * env.train();           // DQN with auto-defaults
 * env.train('ppo');      // switch to PPO
 * ```
 */
export class IgnitionEnvTFJS extends IgnitionEnv {
  constructor(config: IgnitionEnvConfig) {
    super(config);
    this.factories = { ...FACTORIES };
    this.algorithmDefaults = { ...ALGORITHM_DEFAULTS };
  }
}
