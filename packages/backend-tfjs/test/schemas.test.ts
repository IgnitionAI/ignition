import { describe, it, expect } from 'vitest';
import {
  DQNConfigSchema,
  PPOConfigSchema,
  QTableConfigSchema,
} from '../src/schemas';
import { DQNAgent } from '../src/agents/dqn';
import { PPOAgent } from '../src/agents/ppo';
import { QTableAgent } from '../src/agents/qtable';

// ─── DQNConfig ────────────────────────────────────────────────────────────────

describe('DQNConfigSchema', () => {
  const validConfig = { inputSize: 4, actionSize: 2 };

  it('accepts minimal valid config', () => {
    expect(() => DQNConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('accepts full valid config', () => {
    expect(() =>
      DQNConfigSchema.parse({
        inputSize: 4,
        actionSize: 2,
        hiddenLayers: [64, 64],
        gamma: 0.99,
        epsilon: 1.0,
        epsilonDecay: 0.995,
        minEpsilon: 0.01,
        lr: 0.001,
        batchSize: 32,
        memorySize: 10000,
        targetUpdateFrequency: 1000,
      })
    ).not.toThrow();
  });

  it('rejects negative lr', () => {
    const result = DQNConfigSchema.safeParse({ ...validConfig, lr: -0.5 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/lr must be > 0/);
  });

  it('rejects lr = 0', () => {
    const result = DQNConfigSchema.safeParse({ ...validConfig, lr: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects epsilon > 1', () => {
    const result = DQNConfigSchema.safeParse({ ...validConfig, epsilon: 1.5 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/epsilon must be <= 1/);
  });

  it('rejects epsilon < 0', () => {
    const result = DQNConfigSchema.safeParse({ ...validConfig, epsilon: -0.1 });
    expect(result.success).toBe(false);
  });

  it('rejects batchSize = 0', () => {
    const result = DQNConfigSchema.safeParse({ ...validConfig, batchSize: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/batchSize must be > 0/);
  });

  it('rejects memorySize <= batchSize', () => {
    const result = DQNConfigSchema.safeParse({ ...validConfig, batchSize: 64, memorySize: 32 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/memorySize must be > batchSize/);
  });

  it('rejects gamma > 1', () => {
    const result = DQNConfigSchema.safeParse({ ...validConfig, gamma: 1.1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative inputSize', () => {
    const result = DQNConfigSchema.safeParse({ inputSize: -1, actionSize: 2 });
    expect(result.success).toBe(false);
  });
});

describe('DQNAgent constructor validation', () => {
  it('constructs successfully with valid config', () => {
    expect(
      () => new DQNAgent({ inputSize: 4, actionSize: 2, batchSize: 4, memorySize: 100 })
    ).not.toThrow();
  });

  it('throws on invalid lr', () => {
    expect(
      () => new DQNAgent({ inputSize: 4, actionSize: 2, lr: -0.5 })
    ).toThrow(/\[DQNAgent\] Invalid config/);
  });

  it('throws on epsilon > 1', () => {
    expect(
      () => new DQNAgent({ inputSize: 4, actionSize: 2, epsilon: 2 })
    ).toThrow(/\[DQNAgent\] Invalid config/);
  });
});

// ─── PPOConfig ────────────────────────────────────────────────────────────────

describe('PPOConfigSchema', () => {
  const validPPO = {
    inputSize: 4,
    actionSize: 2,
    clipEpsilon: 0.2,
    gamma: 0.99,
    lambda: 0.95,
    epochs: 10,
    miniBatchSize: 64,
    entropyCoeff: 0.01,
    valueLossCoeff: 0.5,
    learningRate: 0.0003,
  };

  it('accepts valid PPO config', () => {
    expect(() => PPOConfigSchema.parse(validPPO)).not.toThrow();
  });

  it('rejects learningRate = 0', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, learningRate: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/learningRate must be > 0/);
  });

  it('rejects clipEpsilon > 1', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, clipEpsilon: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects negative entropyCoeff', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, entropyCoeff: -0.1 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/entropyCoeff must be >= 0/);
  });

  it('rejects epochs = 0', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, epochs: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects valueLossCoeff <= 0', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, valueLossCoeff: -1 });
    expect(result.success).toBe(false);
  });
});

describe('PPOAgent constructor validation', () => {
  const validPPO = {
    inputSize: 4,
    actionSize: 2,
    clipEpsilon: 0.2,
    gamma: 0.99,
    lambda: 0.95,
    epochs: 10,
    miniBatchSize: 64,
    entropyCoeff: 0.01,
    valueLossCoeff: 0.5,
    learningRate: 0.0003,
  };

  it('constructs successfully with valid config', () => {
    expect(() => new PPOAgent(validPPO)).not.toThrow();
  });

  it('throws on learningRate > 1', () => {
    expect(() => new PPOAgent({ ...validPPO, learningRate: 2.0 })).toThrow(/\[PPOAgent\] Invalid config/);
  });
});

// ─── QTableConfig ─────────────────────────────────────────────────────────────

describe('QTableConfigSchema', () => {
  const validQTable = {
    stateSize: 4,
    actionSize: 2,
    learningRate: 0.1,
    gamma: 0.99,
    epsilon: 0.5,
    numBins: 10,
  };

  it('accepts valid QTable config', () => {
    expect(() => QTableConfigSchema.parse(validQTable)).not.toThrow();
  });

  it('rejects learningRate = 0', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, learningRate: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/learningRate must be > 0/);
  });

  it('rejects learningRate >= 1', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, learningRate: 1.0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/learningRate must be < 1/);
  });

  it('rejects epsilon > 1', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, epsilon: 2 });
    expect(result.success).toBe(false);
  });

  it('rejects numBins = 0', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, numBins: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/numBins must be > 0/);
  });

  it('rejects gamma > 1', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, gamma: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('QTableAgent constructor validation', () => {
  const validQTable = {
    stateSize: 4,
    actionSize: 2,
    learningRate: 0.1,
    gamma: 0.99,
    epsilon: 0.5,
    numBins: 10,
  };

  it('constructs successfully', () => {
    expect(() => new QTableAgent(validQTable)).not.toThrow();
  });

  it('throws on negative learningRate', () => {
    expect(() => new QTableAgent({ ...validQTable, learningRate: -0.1 })).toThrow(/\[QTableAgent\] Invalid config/);
  });

  it('throws on numBins = 0', () => {
    expect(() => new QTableAgent({ ...validQTable, numBins: 0 })).toThrow(/\[QTableAgent\] Invalid config/);
  });
});
