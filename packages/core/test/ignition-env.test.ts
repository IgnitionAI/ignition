import { describe, it, expect } from 'vitest';
import { IgnitionEnv } from '../src/ignition-env';
import type { TrainingEnv } from '../src/types';

class MockEnv implements TrainingEnv {
  actions = ['left', 'right'];
  pos = 0;
  stepCalled = 0;
  resetCalled = 0;

<<<<<<< HEAD
  observe() { return [this.pos, 0]; }
  step(action: number | number[]) {
    const a = typeof action === 'number' ? action : action[0];
    this.pos += a === 1 ? 1 : -1;
    this.stepCalled++;
=======
class MockAgent implements AgentInterface {
  public experiences: Experience[] = [];
  public trainCallCount = 0;
  private fixedAction: number;

  constructor(action: number = 0) {
    this.fixedAction = action;
  }

  async getAction(_obs: number[]): Promise<number> {
    return this.fixedAction;
  }

  remember(exp: Experience): void {
    this.experiences.push(exp);
  }

  async train(): Promise<void> {
    this.trainCallCount++;
>>>>>>> feat/53-build-runtime-fix
  }
  reward() { return this.pos > 3 ? 10 : -0.1; }
  done() { return this.pos > 3 || this.stepCalled > 50; }
  reset() { this.pos = 0; this.stepCalled = 0; this.resetCalled++; }
}

<<<<<<< HEAD
describe('IgnitionEnv with TrainingEnv interface', () => {
  it('constructs with a valid TrainingEnv', () => {
    expect(() => new IgnitionEnv(new MockEnv())).not.toThrow();
=======
// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEnv(overrides: Partial<{
  done: boolean;
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
    isDone: () => overrides.done ?? false,
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
      done: false,
    });
>>>>>>> feat/53-build-runtime-fix
  });

  it('rejects an object missing methods', () => {
    expect(() => new IgnitionEnv({ observe: () => [0] } as any)).toThrow(/step/);
  });

<<<<<<< HEAD
  it('rejects an object missing actions', () => {
    expect(() => new IgnitionEnv({
      observe: () => [0], step: () => {}, reward: () => 0, done: () => false, reset: () => {},
    } as any)).toThrow(/actions/);
=======
  it('step() stores experience in agent memory', async () => {
    const agent = new MockAgent(2);
    const env = makeEnv({ agent });
    await env.step();

    expect(agent.experiences).toHaveLength(1);
    const exp = agent.experiences[0];
    expect(exp.action).toBe(2);
    expect(exp.reward).toBe(1.0);
    expect(exp.done).toBe(false);
>>>>>>> feat/53-build-runtime-fix
  });

  it('agent is null before train()', () => {
    const env = new IgnitionEnv(new MockEnv());
    expect(env.agent).toBeNull();
  });

<<<<<<< HEAD
  it('throws on train() without factories', () => {
    const env = new IgnitionEnv(new MockEnv());
    expect(() => env.train('dqn')).toThrow(/Unknown algorithm/);
  });

  it('step() throws without agent', async () => {
    const env = new IgnitionEnv(new MockEnv());
    await expect(env.step()).rejects.toThrow(/No agent/);
  });

  it('reset() resets env and step count', () => {
    const mockEnv = new MockEnv();
    const env = new IgnitionEnv(mockEnv);
=======
  it('step() calls onReset when done', async () => {
    const onReset = vi.fn();
    const env = makeEnv({ done: true, onReset });
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
      isDone: () => false,
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
      isDone: () => true,
      callbacks: { onEpisodeEnd },
    });
    await env.step();
    expect(onEpisodeEnd).toHaveBeenCalledOnce();
  });

  it('reset() resets stepCount and calls onReset', () => {
    const onReset = vi.fn();
    const env = makeEnv({ onReset });
>>>>>>> feat/53-build-runtime-fix
    (env as any).stepCount = 10;
    env.reset();
    expect(env.stepCount).toBe(0);
    expect(mockEnv.resetCalled).toBe(1);
  });

  it('accepts actions as number', () => {
    const obj = { actions: 4, observe: () => [0], step: () => {}, reward: () => 0, done: () => false, reset: () => {} };
    expect(() => new IgnitionEnv(obj)).not.toThrow();
  });

  it('accepts a plain object (duck typing)', () => {
    const obj = { actions: ['a', 'b'], observe: () => [1], step: () => {}, reward: () => 0, done: () => false, reset: () => {} };
    expect(() => new IgnitionEnv(obj)).not.toThrow();
  });
});
