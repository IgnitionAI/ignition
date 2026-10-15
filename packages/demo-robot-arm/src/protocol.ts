import {
  ArmConfig,
  distance,
  configToPosition,
  gridConfigs,
  SUCCESS_DISTANCE,
  MAX_COMMANDS,
  ACTION_COUNT,
  createRng,
} from './robot-arm-env';

/** Protocol identifier — any variation must be versioned, never tuned silently. */
export const PROTOCOL_ID = 'robot-arm-v1-protocol-1';

/** Seeds fixed by issue #64: three runs, one per seed. */
export const TRAIN_SEEDS = [11, 29, 47] as const;
/** Budget per seed: first limit reached wins. */
export const MAX_TRANSITIONS_PER_SEED = 5000;
export const MAX_MINUTES_PER_SEED = 3;

/** Separate RNG streams: env sampling and agent init/exploration never share a seed. */
export const envSeedFor = (seed: number): number => seed * 7 + 1000;
export const baselineSeed = 101;

/** Target split: 48 train / 12 validation / 20 test, drawn without replacement. */
export const TARGET_SPLIT_SEED = 64;
export const TRAIN_TARGET_COUNT = 48;
export const VAL_TARGET_COUNT = 12;
export const TEST_TARGET_COUNT = 20;

export interface TargetSplit {
  train: ArmConfig[];
  validation: ArmConfig[];
  test: ArmConfig[];
}

/**
 * Deterministic split of the 325-configuration grid: Fisher–Yates shuffle
 * with mulberry32(TARGET_SPLIT_SEED), then contiguous slices. No duplicates,
 * spatially spread by construction (sampling without replacement over the grid).
 */
export function buildTargetSplit(): TargetSplit {
  const configs = gridConfigs();
  const rng = createRng(TARGET_SPLIT_SEED);
  for (let i = configs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [configs[i], configs[j]] = [configs[j], configs[i]];
  }
  return {
    train: configs.slice(0, TRAIN_TARGET_COUNT),
    validation: configs.slice(TRAIN_TARGET_COUNT, TRAIN_TARGET_COUNT + VAL_TARGET_COUNT),
    test: configs.slice(TRAIN_TARGET_COUNT + VAL_TARGET_COUNT, TRAIN_TARGET_COUNT + VAL_TARGET_COUNT + TEST_TARGET_COUNT),
  };
}

export interface EvalEpisodeSpec {
  index: number;
  target: ArmConfig;
  start: ArmConfig;
  maxCommands: number;
}

/**
 * Declared evaluation starts — identical for every policy (initial network,
 * final network, random baseline). Start = gridConfigs[(i*37+11) % 325],
 * advanced (deterministically, same stride) until strictly farther than
 * SUCCESS_DISTANCE from the episode target.
 */
export function evalEpisodeSpec(index: number, target: ArmConfig): EvalEpisodeSpec {
  const configs = gridConfigs();
  const targetPos = configToPosition(target);
  let start = configs[(index * 37 + 11) % configs.length];
  let guard = 0;
  while (distance(configToPosition(start), targetPos) <= SUCCESS_DISTANCE && guard < configs.length) {
    start = configs[(configs.indexOf(start) + 1) % configs.length];
    guard++;
  }
  return { index, target: { ...target }, start: { ...start }, maxCommands: MAX_COMMANDS };
}

/** All 20 frozen test episodes. */
export function evalEpisodes(): EvalEpisodeSpec[] {
  return buildTargetSplit().test.map((target, i) => evalEpisodeSpec(i, target));
}

/** DQN preset fixed by issue #64 (adapted to real API names of DQNAgent). */
export const DQN_PRESET = {
  hiddenLayers: [64, 64],
  lr: 0.001,
  gamma: 0.99,
  epsilon: 1.0,
  minEpsilon: 0.05,
  epsilonDecay: 0.9995,
  batchSize: 32,
  memorySize: 10000,
  targetUpdateFrequency: 500,
};

export const OBSERVATION_SIZE = 6;
export const ACTION_SIZE = ACTION_COUNT;
