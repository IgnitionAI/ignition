import { describe, it, expect } from 'vitest';
import {
  ExperienceSchema,
  IgnitionEnvConfigSchema,
} from '../src/schemas';
import { IgnitionEnv } from '../src/ignition-env';
import type { AgentInterface, Experience } from '../src/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

const mockAgent: AgentInterface = {
  getAction: async () => 0,
  remember: () => {},
  train: async () => {},
};

const validEnvConfig = {
  agent: mockAgent,
  getObservation: () => [0],
  applyAction: () => {},
  computeReward: () => 0,
  isDone: () => false,
};

// ─── ExperienceSchema ─────────────────────────────────────────────────────────

describe('ExperienceSchema', () => {
  it('accepts a valid experience', () => {
    const exp: Experience = {
      state: [0.1, 0.2],
      action: 1,
      reward: -1,
      nextState: [0.3, 0.4],
      done: false,
    };
    expect(() => ExperienceSchema.parse(exp)).not.toThrow();
  });

  it('rejects non-array state', () => {
    expect(() =>
      ExperienceSchema.parse({ state: 'bad', action: 0, reward: 0, nextState: [], done: false })
    ).toThrow();
  });

  it('rejects non-number action', () => {
    expect(() =>
      ExperienceSchema.parse({ state: [], action: 'a', reward: 0, nextState: [], done: false })
    ).toThrow();
  });

  it('rejects non-boolean done', () => {
    expect(() =>
      ExperienceSchema.parse({ state: [], action: 0, reward: 0, nextState: [], done: 'yes' })
    ).toThrow();
  });
});

// ─── IgnitionEnvConfigSchema ──────────────────────────────────────────────────

describe('IgnitionEnvConfigSchema', () => {
  it('accepts a valid config', () => {
    expect(() => IgnitionEnvConfigSchema.parse(validEnvConfig)).not.toThrow();
  });

  it('accepts optional stepIntervalMs > 0', () => {
    expect(() =>
      IgnitionEnvConfigSchema.parse({ ...validEnvConfig, stepIntervalMs: 100 })
    ).not.toThrow();
  });

  it('rejects stepIntervalMs = 0', () => {
    const result = IgnitionEnvConfigSchema.safeParse({ ...validEnvConfig, stepIntervalMs: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/stepIntervalMs must be > 0/);
  });

  it('rejects stepIntervalMs < 0', () => {
    const result = IgnitionEnvConfigSchema.safeParse({ ...validEnvConfig, stepIntervalMs: -10 });
    expect(result.success).toBe(false);
  });

  it('rejects agent without getAction', () => {
    const badAgent = { remember: () => {}, train: async () => {} };
    const result = IgnitionEnvConfigSchema.safeParse({ ...validEnvConfig, agent: badAgent });
    expect(result.success).toBe(false);
  });

  it('rejects non-function getObservation', () => {
    const result = IgnitionEnvConfigSchema.safeParse({ ...validEnvConfig, getObservation: 42 });
    expect(result.success).toBe(false);
  });
});

// ─── IgnitionEnv constructor validation ──────────────────────────────────────

describe('IgnitionEnv constructor validation', () => {
  it('constructs successfully with valid config', () => {
    expect(() => new IgnitionEnv(validEnvConfig)).not.toThrow();
  });

  it('throws with stepIntervalMs = 0', () => {
    expect(() =>
      new IgnitionEnv({ ...validEnvConfig, stepIntervalMs: 0 })
    ).toThrow(/\[IgnitionEnv\] Invalid config/);
  });

  it('throws with negative stepIntervalMs', () => {
    expect(() =>
      new IgnitionEnv({ ...validEnvConfig, stepIntervalMs: -1 })
    ).toThrow(/stepIntervalMs must be > 0/);
  });
});
