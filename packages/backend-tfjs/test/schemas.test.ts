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
    gaeLambda: 0.95,
    epochs: 10,
    batchSize: 64,
    entropyCoef: 0.01,
    valueLossCoef: 0.5,
    lr: 0.0003,
  };

  it('accepts valid PPO config', () => {
    expect(() => PPOConfigSchema.parse(validPPO)).not.toThrow();
  });

  it('rejects lr = 0', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, lr: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/lr must be > 0/);
  });

  it('rejects clipRatio > 1', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, clipRatio: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects negative entropyCoef', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, entropyCoef: -0.1 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/entropyCoef must be >= 0/);
  });

  it('rejects epochs = 0', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, epochs: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects valueLossCoef <= 0', () => {
    const result = PPOConfigSchema.safeParse({ ...validPPO, valueLossCoef: -1 });
    expect(result.success).toBe(false);
  });
});

describe('PPOAgent constructor validation', () => {
  const validPPO = {
    inputSize: 4,
    actionSize: 2,
    clipRatio: 0.2,
    gamma: 0.99,
    gaeLambda: 0.95,
    epochs: 10,
    batchSize: 64,
    entropyCoef: 0.01,
    valueLossCoef: 0.5,
    lr: 0.0003,
  };

  it('constructs successfully with valid config', () => {
    expect(() => new PPOAgent(validPPO)).not.toThrow();
  });

  it('throws on lr > 1', () => {
    expect(() => new PPOAgent({ ...validPPO, lr: 2.0 })).toThrow(/\[PPOAgent\] Invalid config/);
  });
});

// ─── QTableConfig ─────────────────────────────────────────────────────────────

describe('QTableConfigSchema', () => {
  const validQTable = {
    inputSize: 4,
    actionSize: 2,
    lr: 0.1,
    gamma: 0.99,
    epsilon: 0.5,
    stateBins: 10,
  };

  it('accepts valid QTable config', () => {
    expect(() => QTableConfigSchema.parse(validQTable)).not.toThrow();
  });

  it('rejects lr = 0', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, lr: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/lr must be > 0/);
  });

  it('rejects lr >= 1', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, lr: 1.0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/lr must be < 1/);
  });

  it('rejects epsilon > 1', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, epsilon: 2 });
    expect(result.success).toBe(false);
  });

  it('rejects stateBins = 0', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, stateBins: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/stateBins must be > 0/);
  });

  it('rejects gamma > 1', () => {
    const result = QTableConfigSchema.safeParse({ ...validQTable, gamma: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('QTableAgent constructor validation', () => {
  const validQTable = {
    inputSize: 4,
    actionSize: 2,
    lr: 0.1,
    gamma: 0.99,
    epsilon: 0.5,
    stateBins: 10,
  };

  it('constructs successfully', () => {
    expect(() => new QTableAgent(validQTable)).not.toThrow();
  });

  it('throws on negative lr', () => {
    expect(() => new QTableAgent({ ...validQTable, lr: -0.1 })).toThrow(/\[QTableAgent\] Invalid config/);
  });

  it('throws on stateBins = 0', () => {
    expect(() => new QTableAgent({ ...validQTable, stateBins: 0 })).toThrow(/\[QTableAgent\] Invalid config/);
  });
});
