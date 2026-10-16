import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IgnitionEnv } from '../src/ignition-env';
import type { TrainingEnv, AgentInterface } from '../src/types';

class MockEnv implements TrainingEnv {
  actions = ['left', 'right'];
  observe = () => [0, 0];
  step = () => {};
  reward = () => 0;
  done = () => false;
  reset = () => {};
}

class MockAgent implements AgentInterface {
  savedArgs: { modelId: string; metadata?: Record<string, unknown> } | null = null;
  loadedModelId: string | null = null;
  state = { epsilon: 0.5 };

  getAction = vi.fn(async () => 0);
  remember = vi.fn();
  train = vi.fn(async () => {});

  save = vi.fn(async (modelId: string, metadata?: Record<string, unknown>) => {
    this.savedArgs = { modelId, metadata };
    return `mock://${modelId}`;
  });

  load = vi.fn(async (modelId: string) => {
    this.loadedModelId = modelId;
  });

  getState = vi.fn(() => this.state);
  setState = vi.fn((s: Record<string, unknown>) => {
    this.state = { ...this.state, ...s };
  });
}

describe('IgnitionEnv persistence', () => {
  let env: IgnitionEnv;
  let agent: MockAgent;

  beforeEach(() => {
    env = new IgnitionEnv(new MockEnv());
    agent = new MockAgent();
    env.agent = agent;
    (env as any).currentAlgorithm = 'dqn';
  });

  it('save() delegates to agent.save() with merged metadata', async () => {
    await env.save('my-model', { author: 'test' });

    expect(agent.save).toHaveBeenCalledOnce();
    expect(agent.save).toHaveBeenCalledWith('my-model', expect.objectContaining({
      algorithm: 'dqn',
      stepCount: 0,
      epsilon: 0.5,
      author: 'test',
    }));
  });

  it('save() includes agent state when getState is available', async () => {
    agent.state = { epsilon: 0.3, trainStepCounter: 42 };
    await env.save('model-v2');

    const meta = agent.savedArgs?.metadata;
    expect(meta).toMatchObject({ epsilon: 0.3, trainStepCounter: 42 });
  });

  it('load() delegates to agent.load()', async () => {
    await env.load('my-model');
    expect(agent.load).toHaveBeenCalledOnce();
    expect(agent.load).toHaveBeenCalledWith('my-model');
  });

  it('save() throws when agent lacks save()', async () => {
    const bareAgent: AgentInterface = {
      getAction: vi.fn(),
      remember: vi.fn(),
      train: vi.fn(),
    };
    env.agent = bareAgent;

    await expect(env.save('x')).rejects.toThrow('does not support persistence');
  });

  it('load() throws when agent lacks load()', async () => {
    const bareAgent: AgentInterface = {
      getAction: vi.fn(),
      remember: vi.fn(),
      train: vi.fn(),
    };
    env.agent = bareAgent;

    await expect(env.load('x')).rejects.toThrow('does not support persistence');
  });
});
