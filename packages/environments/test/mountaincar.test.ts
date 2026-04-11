import { describe, it, expect, beforeEach } from 'vitest';
import { MountainCarEnv } from '../src/mountaincar';

describe('MountainCarEnv', () => {
  let env: MountainCarEnv;

  beforeEach(() => {
    env = new MountainCarEnv();
  });

  it('initializes with position in [-0.6, -0.4] and velocity 0', () => {
    const obs = env.observe();
    expect(obs).toHaveLength(2);
    expect(obs[0]).toBeGreaterThanOrEqual(-0.6);
    expect(obs[0]).toBeLessThanOrEqual(-0.4);
    expect(obs[1]).toBe(0);
  });

  it('observe() returns [position, velocity]', () => {
    const obs = env.observe();
    expect(typeof obs[0]).toBe('number');
    expect(typeof obs[1]).toBe('number');
  });

  it('step(2) pushes right — velocity increases', () => {
    const v0 = env.velocity;
    env.step(2); // push right
    expect(env.velocity).toBeGreaterThan(v0);
  });

  it('step(0) pushes left — velocity decreases', () => {
    const v0 = env.velocity;
    env.step(0); // push left
    expect(env.velocity).toBeLessThan(v0);
  });

  it('step(1) no action — only gravity affects velocity', () => {
    env.step(1);
    // Should still move due to gravity on slope
    expect(env.velocity).not.toBe(0);
  });

  it('velocity is clamped to [-0.07, 0.07]', () => {
    for (let i = 0; i < 100; i++) env.step(2); // push right many times
    expect(env.velocity).toBeLessThanOrEqual(0.07);
    expect(env.velocity).toBeGreaterThanOrEqual(-0.07);
  });

  it('position is clamped to [-1.2, 0.6]', () => {
    for (let i = 0; i < 200; i++) env.step(0); // push left many times
    expect(env.position).toBeGreaterThanOrEqual(-1.2);
  });

  it('reward is -1 per step', () => {
    expect(env.reward()).toBe(-1);
  });

  it('done() returns false initially', () => {
    expect(env.done()).toBe(false);
  });

  it('done() returns true when position >= 0.5', () => {
    env.position = 0.5;
    expect(env.done()).toBe(true);
  });

  it('done() returns true after 200 steps', () => {
    env.stepCount = 200;
    expect(env.done()).toBe(true);
  });

  it('reset() restarts position and velocity', () => {
    env.step(2);
    env.step(2);
    env.reset();
    expect(env.position).toBeGreaterThanOrEqual(-0.6);
    expect(env.position).toBeLessThanOrEqual(-0.4);
    expect(env.velocity).toBe(0);
    expect(env.stepCount).toBe(0);
  });

  it('height() returns sin(3 * position)', () => {
    expect(env.height(0)).toBeCloseTo(Math.sin(0), 5);
    expect(env.height(1)).toBeCloseTo(Math.sin(3), 5);
  });
});
