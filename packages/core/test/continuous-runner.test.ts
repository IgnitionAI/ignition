import { expect, it, vi } from 'vitest';
import {
  ContinuousRunner, type ContinuousAgent, type ContinuousExperience, type ContinuousTrainingEnv,
} from '../src';

function fixture(terminated = false, truncated = false) {
  let position = 1;
  const env: ContinuousTrainingEnv = {
    actionSpace: { type: 'box', shape: [1], low: [-2], high: [2] },
    observe: () => [position], step(action) { position += action[0]; action[0] = 99; },
    reward: () => -position, terminated: () => terminated, truncated: () => truncated,
    reset() { position = 0; },
  };
  const transitions: ContinuousExperience[] = [];
  const agent: ContinuousAgent = {
    async getAction(observation) { observation[0] = 100; return [0.5]; },
    remember(experience) { transitions.push(experience); }, train: vi.fn(async () => {}), dispose() {},
  };
  return { env, agent, transitions, runner: new ContinuousRunner(env, agent) };
}

it.each([[true, false], [false, true]])('captures final state before reset: terminated=%s truncated=%s', async (terminated, truncated) => {
  const { runner, transitions, agent } = fixture(terminated, truncated);
  const result = await runner.step();
  expect(result).toEqual({ observation: [1.5], action: [0.5], reward: -1.5, terminated, truncated });
  expect(transitions).toEqual([{ state: [1], nextState: [1.5], action: [0.5], reward: -1.5, terminated, truncated }]);
  transitions[0].nextState[0] = 100;
  expect(result.observation).toEqual([1.5]);
  await runner.step();
  expect(transitions[1].state).toEqual([0]);
  expect(agent.train).toHaveBeenCalledTimes(2);
});

it('performs greedy inference without inserting replay or updating the agent', async () => {
  const { runner, agent, transitions } = fixture();
  const seen: boolean[] = [];
  agent.getAction = async (_observation, greedy) => { seen.push(!!greedy); return [-1]; };
  expect((await runner.inferStep()).observation).toEqual([0]);
  expect(seen).toEqual([true]);
  expect(transitions).toEqual([]);
  expect(agent.train).not.toHaveBeenCalled();
});

it('rejects invalid agent actions before moving the environment', async () => {
  const { runner, agent, env } = fixture();
  agent.getAction = async () => [3];
  await expect(runner.step()).rejects.toThrow(/bounds/);
  expect(env.observe()).toEqual([1]);
  agent.getAction = async () => [0];
  expect((await runner.step()).observation).toEqual([1]);
});

it('serializes decisions and reset while draining an active transition', async () => {
  const { runner, agent, transitions, env } = fixture();
  let release: (() => void) | undefined;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const observed: number[][] = [];
  agent.getAction = async observation => { observed.push(observation); await barrier; return [1]; };
  const first = runner.step(), second = runner.step(), reset = runner.reset();
  await Promise.resolve();
  expect(observed).toEqual([[1]]);
  release!();
  await Promise.all([first, second, reset]);
  expect(observed).toEqual([[1], [2]]);
  expect(transitions.map(item => item.nextState)).toEqual([[2], [3]]);
  expect(env.observe()).toEqual([0]);
});

it('stop cancels a queued automatic tick without cancelling explicit steps', async () => {
  vi.useFakeTimers();
  const { runner, agent } = fixture();
  let release: (() => void) | undefined;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  let decisions = 0;
  agent.getAction = async () => { decisions++; await barrier; return [0]; };
  try {
    const explicit = runner.step();
    runner.train();
    vi.advanceTimersByTime(50);
    const stopped = runner.stop();
    release!();
    await Promise.all([explicit, stopped]);
    await vi.advanceTimersByTimeAsync(100);
    expect(decisions).toBe(1);
  } finally { await runner.stop(); vi.useRealTimers(); }
});

it('reports an automatic environment failure and stops further updates', async () => {
  vi.useFakeTimers();
  const { runner, env, agent } = fixture();
  env.reward = () => NaN;
  try {
    runner.train();
    await vi.advanceTimersByTimeAsync(50);
    expect(runner.lastError?.message).toMatch(/Reward/);
    expect(agent.train).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(env.observe()).toEqual([1.5]);
  } finally { await runner.stop(); vi.useRealTimers(); }
});

it('keeps the environment cursor consistent after a learning update fails', async () => {
  const { runner, agent, transitions } = fixture();
  vi.mocked(agent.train).mockRejectedValueOnce(new Error('optimizer failure'));
  await expect(runner.step()).rejects.toThrow('optimizer failure');
  await runner.step();
  expect(transitions[1].state).toEqual([1.5]);
  expect(transitions[1].nextState).toEqual([2]);
});
