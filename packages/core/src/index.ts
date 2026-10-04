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

export { mergeDefaults } from './defaults.js';
export { validateTrainingEnv, validateInferenceEnv } from './env-validation.js';
export { ExperienceSchema } from './schemas.js';

export type {
  ContinuousTrainingEnv, ContinuousExperience, ContinuousAgent, ContinuousActionBounds,
} from './continuous.js';
export {
  validateContinuousBounds, validateContinuousVector, validateContinuousAction, validateContinuousEnv,
} from './continuous.js';
export { ContinuousRunner } from './continuous-runner.js';
export type { ContinuousStepResult } from './continuous-runner.js';
export { MultiAgentRunner } from './multi-agent.js';
export type { AgentId, MultiAgentAction, MultiAgentEnv, MultiAgentStepResult } from './multi-agent.js';
