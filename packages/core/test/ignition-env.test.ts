import { describe, it, expect } from 'vitest';
import { IgnitionEnv } from '../src/ignition-env';
import type { TrainingEnv } from '../src/types';

class MockEnv implements TrainingEnv {
  actions = ['left', 'right'];
  pos = 0;
  stepCalled = 0;
  resetCalled = 0;

  observe() { return [this.pos, 0]; }
  step(action: number | number[]) {
    const a = typeof action === 'number' ? action : action[0];
    this.pos += a === 1 ? 1 : -1;
    this.stepCalled++;
  }
  reward() { return this.pos > 3 ? 10 : -0.1; }
  done() { return this.pos > 3 || this.stepCalled > 50; }
  reset() { this.pos = 0; this.stepCalled = 0; this.resetCalled++; }
}

describe('IgnitionEnv with TrainingEnv interface', () => {
  it('constructs with a valid TrainingEnv', () => {
    expect(() => new IgnitionEnv(new MockEnv())).not.toThrow();
  });

  it('rejects an object missing methods', () => {
    expect(() => new IgnitionEnv({ observe: () => [0] } as any)).toThrow(/step/);
  });

  it('rejects an object missing actions', () => {
    expect(() => new IgnitionEnv({
      observe: () => [0], step: () => {}, reward: () => 0, done: () => false, reset: () => {},
    } as any)).toThrow(/actions/);
  });

  it('agent is null before train()', () => {
    const env = new IgnitionEnv(new MockEnv());
    expect(env.agent).toBeNull();
  });

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
