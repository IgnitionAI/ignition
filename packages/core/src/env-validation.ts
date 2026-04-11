import type { TrainingEnv, InferenceEnv } from './types';

function assertFn(obj: Record<string, unknown>, name: string, context: string): void {
  if (typeof obj[name] !== 'function') {
    throw new Error(`[IgnitionAI] ${context} must implement ${name}() as a function`);
  }
}

export function validateTrainingEnv(env: unknown): asserts env is TrainingEnv {
  if (!env || typeof env !== 'object') {
    throw new Error('[IgnitionAI] Environment must be an object implementing TrainingEnv');
  }

  const e = env as Record<string, unknown>;

  assertFn(e, 'observe', 'TrainingEnv');
  assertFn(e, 'step', 'TrainingEnv');
  assertFn(e, 'reward', 'TrainingEnv');
  assertFn(e, 'done', 'TrainingEnv');
  assertFn(e, 'reset', 'TrainingEnv');

  if (e.actions === undefined || e.actions === null) {
    throw new Error('[IgnitionAI] TrainingEnv must have an actions property (string[] or number)');
  }

  if (Array.isArray(e.actions)) {
    if ((e.actions as unknown[]).length === 0) {
      throw new Error('[IgnitionAI] TrainingEnv.actions must have at least one action');
    }
  } else if (typeof e.actions === 'number') {
    if (e.actions <= 0) {
      throw new Error('[IgnitionAI] TrainingEnv.actions must have at least one action');
    }
  } else {
    throw new Error('[IgnitionAI] TrainingEnv.actions must be a string[] or a positive number');
  }
}

export function validateInferenceEnv(env: unknown): asserts env is InferenceEnv {
  if (!env || typeof env !== 'object') {
    throw new Error('[IgnitionAI] Environment must be an object implementing InferenceEnv');
  }

  const e = env as Record<string, unknown>;
  assertFn(e, 'observe', 'InferenceEnv');
  assertFn(e, 'step', 'InferenceEnv');
}
