import { IgnitionEnv, type TrainingEnv, type AgentFactory } from '@ignitionai/core';
import { DQNAgent } from './agents/dqn.js';
import { PPOAgent } from './agents/ppo.js';
import { QTableAgent } from './agents/qtable.js';
import { ALGORITHM_DEFAULTS } from './defaults.js';
import type { DQNConfig, PPOConfig, QTableConfig } from './types.js';

const FACTORIES: Record<string, AgentFactory> = {
  'double-dqn': (config) => new DQNAgent({ ...(config as unknown as DQNConfig), doubleQ: true }),
  dqn: (config) => new DQNAgent(config as unknown as DQNConfig),
  ppo: (config) => new PPOAgent(config as unknown as PPOConfig),
  qtable: (config) => new QTableAgent(config as unknown as QTableConfig),
};

/**
 * IgnitionEnv with TF.js agent factories baked in.
 *
 * ```ts
 * import { IgnitionEnv } from '@ignitionai/backend-tfjs';
 *
 * const env = new IgnitionEnv(new MyGameEnv());
 * env.train();           // DQN with auto-defaults
 * env.train('ppo');      // switch to PPO
 * ```
 */
export class IgnitionEnvTFJS extends IgnitionEnv {
  constructor(env: TrainingEnv) {
    super(env);
    this.factories = { ...FACTORIES };
    this.algorithmDefaults = { ...ALGORITHM_DEFAULTS };
  }
}
