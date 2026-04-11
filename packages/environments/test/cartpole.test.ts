import { describe, it, expect, beforeEach } from 'vitest';
import { CartPoleEnv } from '../src/cartpole';

describe('CartPoleEnv', () => {
  let env: CartPoleEnv;

  beforeEach(() => {
    env = new CartPoleEnv();
  });

  it('initializes with state near zero', () => {
    const obs = env.observe();
    expect(obs).toHaveLength(4);
    // All values should be small (random init near 0)
    obs.forEach((v) => expect(Math.abs(v)).toBeLessThan(0.1));
  });

  it('observe() returns [x, xDot, theta, thetaDot]', () => {
    const obs = env.observe();
    expect(obs).toHaveLength(4);
    expect(typeof obs[0]).toBe('number');
  });

  it('step(0) applies force left, step(1) applies force right', () => {
    const obs0 = env.observe();
    env.step(1); // push right
    const obs1 = env.observe();
    // Cart should have moved right (positive x velocity)
    expect(obs1[1]).toBeGreaterThan(obs0[1]); // xDot increased
  });

  it('reward is +1 per step while pole is up', () => {
    expect(env.reward()).toBe(1);
  });

  it('done() returns false initially', () => {
    expect(env.done()).toBe(false);
  });

  it('done() returns true when pole angle exceeds 12 degrees', () => {
    // Force pole past limit
    env.state.theta = 0.3; // ~17 degrees > 12 degrees
    expect(env.done()).toBe(true);
  });

  it('done() returns true when cart out of bounds', () => {
    env.state.x = 3.0; // > 2.4
    expect(env.done()).toBe(true);
  });

  it('done() returns true after 500 steps (solved)', () => {
    env.state.stepCount = 500;
    expect(env.done()).toBe(true);
  });

  it('reset() resets state to near zero', () => {
    env.step(1);
    env.step(1);
    env.step(1);
    env.reset();
    const obs = env.observe();
    obs.forEach((v) => expect(Math.abs(v)).toBeLessThan(0.1));
    expect(env.state.stepCount).toBe(0);
  });

  it('physics produces reasonable dynamics over 10 steps', () => {
    for (let i = 0; i < 10; i++) {
      env.step(1); // keep pushing right
    }
    const obs = env.observe();
    // Cart should have moved right
    expect(obs[0]).toBeGreaterThan(0);
    // Pole should have tilted (either direction depending on physics)
    expect(obs[2]).not.toBe(0);
  });
});
