<<<<<<< HEAD
=======
export * from './agents/dqn';
export * from './agents/ppo';
export * from './agents/qtable';
// ReplayBuffer ré-exporte Experience depuis @ignitionai/core — export explicite
// de la classe uniquement pour éviter l'ambiguïté TS2308 avec './types'.
export { ReplayBuffer } from './memory/ReplayBuffer';
export * from './model/BuildMLP';
export * from './types';
// Exports explicites (pas de `export *`) : les types z.infer de ./schemas
// portent les mêmes noms que ./types — un export * créerait une ambiguïté TS2308.
export {
  DQNConfigSchema,
  PPOConfigSchema,
  QTableConfigSchema,
} from './schemas';
>>>>>>> feat/53-build-runtime-fix
export { DQNAgent } from './agents/dqn';
export { PPOAgent } from './agents/ppo';
export { QTableAgent } from './agents/qtable';
export { ReplayBuffer } from './memory/ReplayBuffer';
export { buildQNetwork } from './model/BuildMLP';
export { setBackend, getAvailableBackends } from './utils/backend-selector';
export type { TFBackend } from './utils/backend-selector';
export type { AgentInterface, Experience } from './types';
export type { DQNConfig, PPOConfig, QTableConfig } from './types';
export { DQNConfigSchema, PPOConfigSchema, QTableConfigSchema } from './schemas';
export { IgnitionEnvTFJS, IgnitionEnvTFJS as IgnitionEnv } from './ignition-env-tfjs';
export { ALGORITHM_DEFAULTS, DQN_DEFAULTS, PPO_DEFAULTS, QTABLE_DEFAULTS } from './defaults';
