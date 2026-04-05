import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IgnitionEnv } from '../src/ignition-env';
import { AgentInterface, Experience, StepResult } from '../src/types';

// ─── MockAgent ───────────────────────────────────────────────────────────────

class MockAgent implements AgentInterface {
  public experiences: Experience[] = [];
  public trainCallCount = 0;
  private fixedAction: number | number[];

  constructor(action: number | number[] = 0) {
    this.fixedAction = action;
  }

  async getAction(_obs: number[]): Promise<number | number[]> {
    return this.fixedAction;
  }

  remember(exp: Experience): void {
    this.experiences.push(exp);
  }

  async train(): Promise<void> {
    this.trainCallCount++;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEnv(overrides: Partial<{
  terminated: boolean;
  truncated: boolean;
  agent: AgentInterface;
  onReset: () => void;
}> = {}) {
  let obs = [0, 0];
  const agent = overrides.agent ?? new MockAgent(1);

  return new IgnitionEnv({
    agent,
    getObservation: () => [...obs],
    applyAction: (action) => { obs = [Number(Array.isArray(action) ? action[0] : action), 0]; },
    computeReward: () => 1.0,
    isTerminated: () => overrides.terminated ?? false,
    isTruncated: overrides.truncated !== undefined ? () => overrides.truncated! : undefined,
    onReset: overrides.onReset,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('IgnitionEnv', () => {
  it('step() returns a StepResult', async () => {
    const env = makeEnv();
    const result = await env.step();

    expect(result).toMatchObject<StepResult>({
      observation: expect.any(Array),
      reward: 1.0,
      terminated: false,
      truncated: false,
    });
  });

  it('step() increments stepCount', async () => {
    const env = makeEnv();
    expect(env.stepCount).toBe(0);
    await env.step();
    expect(env.stepCount).toBe(1);
    await env.step();
    expect(env.stepCount).toBe(2);
  });

  it('step() stores experience in agent memory', async () => {
    const agent = new MockAgent(2);
    const env = makeEnv({ agent });
    await env.step();

    expect(agent.experiences).toHaveLength(1);
    const exp = agent.experiences[0];
    expect(exp.action).toBe(2);
    expect(exp.reward).toBe(1.0);
    expect(exp.terminated).toBe(false);
    expect(exp.truncated).toBe(false);
  });

  it('step() calls agent.train() once per step', async () => {
    const agent = new MockAgent();
    const env = makeEnv({ agent });
    await env.step();
    await env.step();
    expect(agent.trainCallCount).toBe(2);
  });

  it('step() calls onReset when terminated', async () => {
    const onReset = vi.fn();
    const env = makeEnv({ terminated: true, onReset });
    await env.step();
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('step() calls onReset when truncated', async () => {
    const onReset = vi.fn();
    const env = makeEnv({ truncated: true, onReset });
    await env.step();
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('step() invokes onStep callback', async () => {
    const onStep = vi.fn();
    const env = new IgnitionEnv({
      agent: new MockAgent(),
      getObservation: () => [1],
      applyAction: () => {},
      computeReward: () => 2.5,
      isTerminated: () => false,
      callbacks: { onStep },
    });
    await env.step();
    expect(onStep).toHaveBeenCalledOnce();
    const [result, stepCount] = onStep.mock.calls[0];
    expect(result.reward).toBe(2.5);
    expect(stepCount).toBe(1);
  });

  it('step() invokes onEpisodeEnd callback on terminal step', async () => {
    const onEpisodeEnd = vi.fn();
    const env = new IgnitionEnv({
      agent: new MockAgent(),
      getObservation: () => [0],
      applyAction: () => {},
      computeReward: () => 0,
      isTerminated: () => true,
      callbacks: { onEpisodeEnd },
    });
    await env.step();
    expect(onEpisodeEnd).toHaveBeenCalledOnce();
  });

  it('reset() resets stepCount and calls onReset', () => {
    const onReset = vi.fn();
    const env = makeEnv({ onReset });
    (env as any).stepCount = 10;
    env.reset();
    expect(env.stepCount).toBe(0);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('stop() prevents further loop steps', async () => {
    const agent = new MockAgent();
    const env = makeEnv({ agent });
    env.start(true);
    env.stop();
    // Give event loop a tick — no steps should have fired
    await new Promise(r => setTimeout(r, 0));
    expect(agent.trainCallCount).toBe(0);
  });
});
