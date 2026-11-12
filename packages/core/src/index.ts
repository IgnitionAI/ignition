export const version = '0.1.0';

export { IgnitionEnv } from './ignition-env';

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
} from './types';
export { EPISODE_FLAG_NAMES } from './types';

export { mergeDefaults } from './defaults';
export { validateTrainingEnv, validateInferenceEnv } from './env-validation';
export { ExperienceSchema, TrainingEnvSchema } from './schemas';
