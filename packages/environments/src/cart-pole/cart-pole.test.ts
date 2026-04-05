import { describe, it, expect, beforeEach } from 'vitest';
import { CartPoleEnv, createCartPole } from './index';

describe('CartPoleEnv', () => {
  let env: CartPoleEnv;

  beforeEach(() => {
    env = createCartPole();
  });

  it('initial observation has 4 components', () => {
    const obs = env.getObservation();
    expect(obs).toHaveLength(4);
  });

  it('initial observation values are near zero', () => {
    const obs = env.getObservation();
    obs.forEach(v => expect(Math.abs(v)).toBeLessThan(0.1));
  });

  it('isDone is false on reset', () => {
    expect(env.isDone()).toBe(false);
  });

  it('returns +1 reward while balanced', () => {
    env.applyAction(1);
    if (!env.isDone()) {
      expect(env.computeReward()).toBeCloseTo(1.0);
    }
  });

  it('terminates when pole falls (forced extreme angle)', () => {
    // Directly inject an extreme state and apply any action
    (env as any).theta = 0.3; // > 12° threshold
    env.applyAction(0);
    expect(env.isDone()).toBe(true);
  });

  it('terminates when cart goes out of bounds', () => {
    (env as any).x = 2.5; // > 2.4 threshold
    env.applyAction(1);
    expect(env.isDone()).toBe(true);
  });

  it('resets state and isDone becomes false', () => {
    (env as any).theta = 0.3;
    env.applyAction(0);
    expect(env.isDone()).toBe(true);
    env.onReset();
    expect(env.isDone()).toBe(false);
    const obs = env.getObservation();
    obs.forEach(v => expect(Math.abs(v)).toBeLessThan(0.1));
  });

  it('getCallbacks returns bound working methods', () => {
    const cb = env.getCallbacks();
    expect(cb.getObservation()).toHaveLength(4);
    cb.applyAction(1);
    expect(typeof cb.computeReward()).toBe('number');
    expect(typeof cb.isDone()).toBe('boolean');
    cb.onReset();
    expect(cb.isDone()).toBe(false);
  });

  it('survives at least 1 step without crashing', () => {
    expect(() => {
      env.applyAction(0);
      env.computeReward();
      env.isDone();
      env.getObservation();
    }).not.toThrow();
  });
});
