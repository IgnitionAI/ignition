import { it, expect } from 'vitest';
import { QTableAgent } from '../src/agents/qtable';

it('Q-table bootstraps a truncated transition from its actual successor', async () => {
  const agent = new QTableAgent({ inputSize: 1, actionSize: 2, lr: 0.9, gamma: 0.9, epsilon: 0 });
  agent.remember({ state: [1], action: 0, reward: 2, nextState: [1], terminated: true, truncated: false });
  await agent.train();
  agent.remember({ state: [0], action: 0, reward: 0.5, nextState: [0], terminated: true, truncated: false });
  await agent.train();
  agent.remember({ state: [0], action: 1, reward: 0, nextState: [1], terminated: false, truncated: true });
  await agent.train();
  expect(await agent.getAction([0], true)).toBe(1);
});
