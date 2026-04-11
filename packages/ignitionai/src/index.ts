// ─── Core ────────────────────────────────────────────────────────────────────
export {
  IgnitionEnv,
  mergeDefaults,
  validateTrainingEnv,
  validateInferenceEnv,
  ExperienceSchema,
} from '@ignitionai/core';

export type {
  TrainingEnv,
  InferenceEnv,
  AgentInterface,
  AgentFactory,
  AlgorithmType,
  Experience,
  StepResult,
  CheckpointableAgent,
} from '@ignitionai/core';

// ─── Backend TF.js (training) ────────────────────────────────────────────────
export {
  IgnitionEnvTFJS,
  IgnitionEnvTFJS as TrainingRunner,
  DQNAgent,
  PPOAgent,
  QTableAgent,
  DQN_DEFAULTS,
  PPO_DEFAULTS,
  QTABLE_DEFAULTS,
  ALGORITHM_DEFAULTS,
  DQNConfigSchema,
  PPOConfigSchema,
  QTableConfigSchema,
} from '@ignitionai/backend-tfjs';

export type {
  DQNConfig,
  PPOConfig,
  QTableConfig,
} from '@ignitionai/backend-tfjs';

// ─── Backend ONNX (inference) ────────────────────────────────────────────────
export {
  OnnxAgent,
  OnnxAgentConfigSchema,
  saveForOnnxExport,
  generateConversionScript,
  loadOnnxModelFromHub,
  createOnnxSession,
  runInference,
  inspectSession,
} from '@ignitionai/backend-onnx';

export type {
  OnnxAgentConfig,
  ExportResult,
} from '@ignitionai/backend-onnx';

// ─── Storage ─────────────────────────────────────────────────────────────────
export {
  HuggingFaceProvider,
  hfStorageConfigSchema,
  parseHFConfig,
} from '@ignitionai/storage';

export type {
  ModelStorageProvider,
  ModelInfo,
  HFStorageConfig,
} from '@ignitionai/storage';

// ─── Environments ────────────────────────────────────────────────────────────
export {
  GridWorldEnv,
  CartPoleEnv,
  MountainCarEnv,
} from '@ignitionai/environments';
