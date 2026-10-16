import { afterEach, describe, expect, it, vi } from 'vitest';
import { QTableAgent, QTableConfigSchema } from '../src';
import type { QTableConfig } from '../src';

afterEach(() => { vi.unstubAllGlobals(); });

const config = { inputSize: 1, actionSize: 2, stateBins: 5, epsilon: 0.5 };
const experience = { state: [0.2], action: 1, reward: 4, nextState: [0.2], terminated: true, truncated: false };

function storage() {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  return values;
}

async function trainedAgent() {
  const agent = new QTableAgent(config);
  agent.remember(experience);
  await agent.train();
  return agent;
}

describe('Q-table config and checkpoint contract', () => {
  it.each([
    { stateLow: [] }, { stateHigh: [] }, { stateLow: [Infinity] },
    { stateHigh: [NaN] }, { stateLow: [1], stateHigh: [1] },
    { stateLow: [2], stateHigh: [1] }, { inputSize: 17, stateBins: 10 },
  ])('rejects invalid discretization %j at the public boundary', overrides => {
    const invalid = { ...config, ...overrides };
    expect(QTableConfigSchema.safeParse(invalid).success).toBe(false);
    expect(() => new QTableAgent(invalid)).toThrow(/Invalid config/);
  });

  it('uses default bounds and clamps out-of-range observations', async () => {
    const agent = new QTableAgent(config);
    agent.remember({ ...experience, state: [-10] }); await agent.train();
    expect(await agent.getAction([0], true)).toBe(1);
    expect(await agent.getAction([-100], true)).toBe(1);
  });

  it.each([
    { inputSize: 2 }, { actionSize: 3 }, { stateBins: 6 },
    { stateLow: [-1] }, { stateHigh: [2] },
  ])('rejects an incompatible checkpoint without changing the agent: %j', async overrides => {
    storage();
    const source = new QTableAgent({ ...config, ...overrides } satisfies QTableConfig);
    await source.save('source');
    const target = await trainedAgent();
    const epsilon = target.currentEpsilon;
    await expect(target.load('source')).rejects.toThrow(/incompatible/i);
    expect(target.currentEpsilon).toBe(epsilon);
    expect(await target.getAction([0.2], true)).toBe(1);
  });

  it.each([
    '{', '{"qTable":[],"state":{}}',
    JSON.stringify({ config, qTable: [[-1, [0, 1]]], state: { epsilon: 0.1 } }),
    JSON.stringify({ config, qTable: [[5, [0, 1]]], state: { epsilon: 0.1 } }),
    JSON.stringify({ config, qTable: [[1, [0]]], state: { epsilon: 0.1 } }),
    JSON.stringify({ config, qTable: [[1, [null, 1]]], state: { epsilon: 0.1 } }),
    JSON.stringify({ config, qTable: [[1, [0, 1]], [1, [1, 0]]], state: { epsilon: 0.1 } }),
    JSON.stringify({ config, qTable: [[1, [0, 1]]], state: { epsilon: 2 } }),
  ])('rejects malformed checkpoint atomically: %s', async raw => {
    const values = storage();
    values.set('ignition:qtable:bad', raw);
    const target = await trainedAgent();
    const epsilon = target.currentEpsilon;
    await expect(target.load('bad')).rejects.toThrow();
    expect(target.currentEpsilon).toBe(epsilon);
    expect(await target.getAction([0.2], true)).toBe(1);
  });

  it('restores greedy actions and epsilon, keeps current lr and discards pending experience', async () => {
    storage();
    const source = await trainedAgent(); await source.save('good');
    const target = new QTableAgent({ ...config, lr: 0.5 });
    target.remember({ ...experience, action: 0, reward: 100 });
    await target.load('good'); await target.train();
    expect(await target.getAction([0.2], true)).toBe(1);
    expect(target.currentEpsilon).toBe(source.currentEpsilon);
    target.remember({ ...experience, action: 0, reward: 1 }); await target.train();
    expect(await target.getAction([0.2], true)).toBe(0);
  });
});
