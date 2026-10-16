import { describe, it, expect } from 'vitest';
import {
  buildTargetSplit,
  evalEpisodes,
  evalEpisodeSpec,
  TRAIN_TARGET_COUNT,
  VAL_TARGET_COUNT,
  TEST_TARGET_COUNT,
  TRAIN_SEEDS,
  DQN_PRESET,
  PROTOCOL_ID,
} from '../src/protocol';
import { configToPosition, distance, gridConfigs, SUCCESS_DISTANCE } from '../src/robot-arm-env';

describe('protocol target split (robot-arm-v1-protocol-1)', () => {
  it('declares the fixed protocol id and seeds from issue #64', () => {
    expect(PROTOCOL_ID).toBe('robot-arm-v1-protocol-1');
    expect([...TRAIN_SEEDS]).toEqual([11, 29, 47]);
  });

  it('splits into 48 train / 12 validation / 20 test targets', () => {
    const split = buildTargetSplit();
    expect(split.train).toHaveLength(TRAIN_TARGET_COUNT);
    expect(split.validation).toHaveLength(VAL_TARGET_COUNT);
    expect(split.test).toHaveLength(TEST_TARGET_COUNT);
  });

  it('has no duplicate target across or within subsets', () => {
    const split = buildTargetSplit();
    const all = [...split.train, ...split.validation, ...split.test];
    const keys = all.map((c) => JSON.stringify(c));
    expect(new Set(keys).size).toBe(keys.length);
    // every target is a valid grid config
    const grid = new Set(gridConfigs().map((c) => JSON.stringify(c)));
    keys.forEach((k) => expect(grid.has(k)).toBe(true));
  });

  it('is deterministic across calls', () => {
    const a = buildTargetSplit();
    const b = buildTargetSplit();
    expect(a.train).toEqual(b.train);
    expect(a.validation).toEqual(b.validation);
    expect(a.test).toEqual(b.test);
  });

  it('declared evaluation starts are identical for every policy and > 0.10 m away', () => {
    const episodes = evalEpisodes();
    expect(episodes).toHaveLength(TEST_TARGET_COUNT);
    for (const spec of episodes) {
      expect(spec.maxCommands).toBe(80);
      const d = distance(configToPosition(spec.start), configToPosition(spec.target));
      expect(d).toBeGreaterThan(SUCCESS_DISTANCE);
      // determinism: same index → same spec
      expect(evalEpisodeSpec(spec.index, spec.target)).toEqual(spec);
    }
  });

  it('DQN preset matches the issue #64 contract', () => {
    expect(DQN_PRESET.hiddenLayers).toEqual([64, 64]);
    expect(DQN_PRESET.lr).toBe(0.001);
    expect(DQN_PRESET.gamma).toBe(0.99);
    expect(DQN_PRESET.batchSize).toBe(32);
    expect(DQN_PRESET.memorySize).toBe(10000);
    expect(DQN_PRESET.epsilon).toBe(1.0);
    expect(DQN_PRESET.minEpsilon).toBe(0.05);
    expect(DQN_PRESET.epsilonDecay).toBe(0.9995);
    expect(DQN_PRESET.targetUpdateFrequency).toBe(500);
  });
});
