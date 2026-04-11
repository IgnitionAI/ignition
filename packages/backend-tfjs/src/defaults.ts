import type { AlgorithmType } from '@ignitionai/core';

export const DQN_DEFAULTS: Record<string, unknown> = {
  hiddenLayers: [64, 64],
  gamma: 0.99,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  minEpsilon: 0.01,
  lr: 0.001,
  batchSize: 32,
  memorySize: 10000,
  targetUpdateFrequency: 100,
};

export const PPO_DEFAULTS: Record<string, unknown> = {
  hiddenLayers: [64, 64],
  gamma: 0.99,
  gaeLambda: 0.95,
  clipRatio: 0.2,
  lr: 3e-4,
  epochs: 4,
  batchSize: 64,
  entropyCoef: 0.01,
  valueLossCoef: 0.5,
};

export const QTABLE_DEFAULTS: Record<string, unknown> = {
  stateBins: 10,
  gamma: 0.99,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  minEpsilon: 0.01,
  lr: 0.1,
};

export const ALGORITHM_DEFAULTS: Record<string, Record<string, unknown>> = {
  dqn: DQN_DEFAULTS,
  ppo: PPO_DEFAULTS,
  qtable: QTABLE_DEFAULTS,
};
