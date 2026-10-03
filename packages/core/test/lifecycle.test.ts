import { afterEach, describe, expect, it, vi } from 'vitest';
import { IgnitionEnv } from '../src';
import type { AgentInterface, TrainingEnv } from '../src';

function fixture() {
  const events: string[] = [];
  const world: TrainingEnv = {
    actions: 2, observe: () => [events.length],
    step: () => { events.push('step'); }, reward: () => 1,
    done: () => false, reset: () => {},
  };
  function agent(name: string): AgentInterface {
    return {
      getAction: vi.fn(async (_state: number[], greedy?: boolean) => {
        events.push(`${name}:${greedy ? 'infer' : 'train'}`);
        return 0;
      }),
      remember: vi.fn(), train: vi.fn(async () => {}), dispose: vi.fn(),
    };
  }
  const first = agent('first');
  const second = agent('second');
  class Runner extends IgnitionEnv {
    protected factories = { dqn: () => first, ppo: () => second };
  }
  return { runner: new Runner(world), first, second, events };
}

afterEach(() => { vi.useRealTimers(); });

describe('public runner lifecycle', () => {
  it.each(['infer', 'resume', 'repeat-infer', 'switch'] as const)('invalidates pending timers on %s', async operation => {
    vi.useFakeTimers();
    const { runner, first, second, events } = fixture();
    runner.train();
    if (operation === 'resume') { runner.stop(); runner.start(); }
    else if (operation === 'switch') runner.train('ppo');
    else { runner.infer(); if (operation === 'repeat-infer') runner.infer(); }
    await vi.advanceTimersByTimeAsync(50);
    runner.stop();
    const action = operation === 'switch' ? 'second:train' : `first:${operation === 'resume' ? 'train' : 'infer'}`;
    expect(events).toEqual([action, 'step']);
    expect(first.train).toHaveBeenCalledTimes(operation === 'resume' ? 1 : 0);
    expect(second.train).toHaveBeenCalledTimes(operation === 'switch' ? 1 : 0);
    await vi.advanceTimersByTimeAsync(100);
    expect(events).toHaveLength(2);
  });

  it.each(['infer', 'resume', 'switch'] as const)('finishes one in-flight transition before %s', async operation => {
    vi.useFakeTimers();
    const { runner, first, second, events } = fixture();
    let release!: (action: number) => void;
    vi.mocked(first.getAction).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    runner.train();
    await vi.advanceTimersByTimeAsync(50);
    if (operation === 'infer') runner.infer();
    if (operation === 'resume') { runner.stop(); runner.start(); }
    if (operation === 'switch') runner.train('ppo');
    expect(first.dispose).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(50);
    expect(events).toEqual([]);
    release(0);
    await vi.advanceTimersByTimeAsync(0);
    runner.stop();
    expect(first.remember).toHaveBeenCalledTimes(operation === 'resume' ? 2 : 1);
    expect(first.train).toHaveBeenCalledTimes(operation === 'resume' ? 2 : 1);
    expect(second.train).toHaveBeenCalledTimes(operation === 'switch' ? 1 : 0);
    expect(first.dispose).toHaveBeenCalledTimes(operation === 'switch' ? 1 : 0);
    expect(events.filter(event => event === 'step')).toHaveLength(2);
  });

  it('serializes manual public steps and preserves their successor observations', async () => {
    const { runner, first } = fixture();
    runner.train(); runner.stop();
    const results = await Promise.all([runner.step(), runner.inferStep()]);
    expect(results.map(result => result.observation)).toEqual([[2], [4]]);
    expect(first.remember).toHaveBeenCalledOnce();
    expect(first.getAction).toHaveBeenNthCalledWith(2, [2], true);
  });

  it('rejects overrides on an existing agent without losing it', () => {
    const { runner, first } = fixture();
    runner.train('dqn', { lr: 0.01 }); runner.stop();
    expect(() => runner.train('dqn', { lr: 0.02 })).toThrow(/already|existing/i);
    expect(runner.agent).toBe(first);
    runner.train(); runner.stop();
    expect(runner.agent).toBe(first);
    expect(first.dispose).not.toHaveBeenCalled();
  });

  it('stops a failed loop and exposes the error, then permits a clean restart', async () => {
    vi.useFakeTimers();
    const { runner, first, events } = fixture();
    const failure = new Error('action failed');
    vi.mocked(first.getAction).mockRejectedValueOnce(failure);
    runner.train();
    await vi.advanceTimersByTimeAsync(150);
    expect(events).toEqual([]);
    expect(runner).toHaveProperty('lastError', failure);
    runner.start();
    await vi.advanceTimersByTimeAsync(50);
    runner.stop();
    expect(events).toEqual(['first:train', 'step']);
    expect(runner).toHaveProperty('lastError', null);
  });
});
