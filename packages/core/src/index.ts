export const version = '0.1.0';

export { IgnitionEnv } from './ignition-env';
export type { IgnitionEnvConfig } from './ignition-env';

export type {
  TFBackend,
  AgentInterface,
  AgentFactory,
  AlgorithmType,
  CheckpointableAgent,
  Experience,
  StepResult,
  ActionSpace,
  ObservationSpace,
  DiscreteSpace,
  BoxSpace,
  MultiDiscreteSpace,
} from './types';

export { mergeDefaults } from './defaults';

export {
  ExperienceSchema,
  IgnitionEnvConfigSchema,
} from './schemas';
export type { IgnitionEnvCallbacks } from './schemas';
