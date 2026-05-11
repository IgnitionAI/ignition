import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QTableAgent } from '../src/agents/qtable';

// Mock localStorage for Node environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  length: 0,
  key: () => null,
};

describe('QTableAgent persistence', () => {
  beforeEach(() => {
    mockStorage['ignition:qtable:test-model'] = '';
    delete mockStorage['ignition:qtable:test-model'];
  });

  it('save() serializes qTable and config to localStorage', async () => {
    const agent = new QTableAgent({
      inputSize: 2,
      actionSize: 2,
      stateBins: 5,
      stateLow: [0, 0],
      stateHigh: [1, 1],
    });

    // Train a bit to populate qTable
    agent.remember({
      state: [0.2, 0.3],
      action: 0,
      reward: 1,
      nextState: [0.3, 0.4],
      terminated: false,
      truncated: false,
    });
    await agent.train();

    const uri = await agent.save('test-model', { version: '1.0' });
    expect(uri).toBe('localstorage://qtable/test-model');

    const raw = mockStorage['ignition:qtable:test-model'];
    expect(raw).toBeTruthy();

    const payload = JSON.parse(raw);
    expect(payload.config.inputSize).toBe(2);
    expect(payload.config.actionSize).toBe(2);
    expect(payload.metadata.version).toBe('1.0');
    expect(payload.qTable.length).toBeGreaterThan(0);
    expect(payload.state.epsilon).toBeLessThan(1.0); // epsilon decayed after train
  });

  it('load() restores qTable and state from localStorage', async () => {
    const agent1 = new QTableAgent({
      inputSize: 2,
      actionSize: 2,
      stateBins: 5,
      stateLow: [0, 0],
      stateHigh: [1, 1],
    });

    agent1.remember({ state: [0.2, 0.3], action: 0, reward: 1, nextState: [0.3, 0.4], terminated: false, truncated: false });
    await agent1.train();
    await agent1.save('test-model');

    const agent2 = new QTableAgent({
      inputSize: 2,
      actionSize: 2,
      stateBins: 5,
      stateLow: [0, 0],
      stateHigh: [1, 1],
    });

    await agent2.load('test-model');
    expect(agent2.tableSize).toBe(agent1.tableSize);
    expect(agent2.currentEpsilon).toBe(agent1.currentEpsilon);
  });

  it('load() throws when model does not exist', async () => {
    const agent = new QTableAgent({ inputSize: 1, actionSize: 2 });
    await expect(agent.load('nonexistent')).rejects.toThrow('No saved model found');
  });
});
