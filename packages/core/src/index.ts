export const version = '0.1.0';

export { IgnitionEnv } from './ignition-env.js';

export type {
  TFBackend,
  AgentInterface,
  AgentFactory,
  AlgorithmType,
  CheckpointableAgent,
  Experience,
  StepResult,
  TrainingEnv,
  InferenceEnv,
  ActionSpace,
  ObservationSpace,
  DiscreteSpace,
  BoxSpace,
  MultiDiscreteSpace,
} from './types.js';
export { EPISODE_FLAG_NAMES } from './types.js';

export { mergeDefaults } from './defaults.js';
export { validateTrainingEnv, validateInferenceEnv } from './env-validation.js';
export { ExperienceSchema, TrainingEnvSchema } from './schemas.js';
