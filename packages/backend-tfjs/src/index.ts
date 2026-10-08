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
export { DQNAgent } from './agents/dqn';
export { PPOAgent } from './agents/ppo';
export { QTableAgent } from './agents/qtable';
export { setBackend, getAvailableBackends } from './utils/backend-selector';
export type { TFBackend } from './utils/backend-selector';
