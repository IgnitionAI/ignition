import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitEnv } from '../src/circuit-env';

describe('CircuitEnv', () => {
  let env: CircuitEnv;

  beforeEach(() => {
    env = new CircuitEnv();
  });

  it('implements TrainingEnv: has actions, observe, step, reward, done, reset', () => {
    expect(env.actions).toBeDefined();
    expect(typeof env.observe).toBe('function');
    expect(typeof env.step).toBe('function');
    expect(typeof env.reward).toBe('function');
    expect(typeof env.done).toBe('function');
    expect(typeof env.reset).toBe('function');
  });

  it('actions has 3 options', () => {
    expect(env.actions).toHaveLength(3);
  });

  it('observe returns 5 normalized values', () => {
    const obs = env.observe();
    expect(obs).toHaveLength(5);
    obs.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThanOrEqual(2);
    });
  });

  it('step changes car position', () => {
    const before = { x: env.carX, y: env.carY };
    env.step(1); // straight
    expect(env.carX !== before.x || env.carY !== before.y).toBe(true);
  });

  it('step(0) turns left, step(2) turns right', () => {
    const a0 = env.carAngle;
    env.step(0); // left
    expect(env.carAngle).not.toBe(a0);

    const a1 = env.carAngle;
    env.step(2); // right
    expect(env.carAngle).not.toBe(a1);
  });

  it('reward is positive when on track', () => {
    // Car starts on track
    expect(env.reward()).toBeGreaterThan(0);
  });

  it('done returns false initially', () => {
    expect(env.done()).toBe(false);
  });

  it('done returns true after max steps', () => {
    env.stepCount = 500;
    expect(env.done()).toBe(true);
  });

  it('reset puts car back on track', () => {
    for (let i = 0; i < 50; i++) env.step(0); // spin in circles
    env.reset();
    expect(env.stepCount).toBe(0);
    expect(env.reward()).toBeGreaterThan(0); // back on track
  });

  it('car going off track triggers done', () => {
    // Steer hard left repeatedly to go off track
    for (let i = 0; i < 50 && !env.done(); i++) env.step(0);
    expect(env.done()).toBe(true);
  });
});
