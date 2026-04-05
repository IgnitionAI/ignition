import { describe, it, expect, beforeEach } from 'vitest';
import { MountainCarEnv, createMountainCar } from './index';

describe('MountainCarEnv', () => {
  let env: MountainCarEnv;

  beforeEach(() => {
    env = createMountainCar();
  });

  it('initial observation has 2 components', () => {
    expect(env.getObservation()).toHaveLength(2);
  });

  it('initial position is in [-0.6, -0.4]', () => {
    const [pos] = env.getObservation();
    expect(pos).toBeGreaterThanOrEqual(-0.6);
    expect(pos).toBeLessThanOrEqual(-0.4);
  });

  it('initial velocity is 0', () => {
    const [, vel] = env.getObservation();
    expect(vel).toBeCloseTo(0);
  });

  it('isDone is false initially', () => {
    expect(env.isDone()).toBe(false);
  });

  it('returns -1 reward per step', () => {
    env.applyAction(2); // push right
    expect(env.computeReward()).toBeCloseTo(-1);
  });

  it('position stays within bounds', () => {
    for (let i = 0; i < 50; i++) {
      env.applyAction(0); // push left repeatedly
    }
    const [pos, vel] = env.getObservation();
    expect(pos).toBeGreaterThanOrEqual(-1.2);
    expect(pos).toBeLessThanOrEqual(0.6);
    expect(vel).toBeGreaterThanOrEqual(-0.07);
    expect(vel).toBeLessThanOrEqual(0.07);
  });

  it('truncates after 200 steps', () => {
    for (let i = 0; i < 200; i++) {
      if (env.isDone()) break;
      env.applyAction(1); // no push — worst case
    }
    expect(env.isDone()).toBe(true);
  });

  it('terminates when goal is reached (position >= 0.5)', () => {
    // Force position to goal
    (env as any).position = 0.49;
    (env as any).velocity = 0.05;
    env.applyAction(2);
    expect(env.isDone()).toBe(true);
    expect(env.computeReward()).toBeCloseTo(0);
  });

  it('resets correctly', () => {
    for (let i = 0; i < 200; i++) env.applyAction(1);
    expect(env.isDone()).toBe(true);
    env.onReset();
    expect(env.isDone()).toBe(false);
    expect(env.getStepCount()).toBe(0);
    const [pos] = env.getObservation();
    expect(pos).toBeGreaterThanOrEqual(-0.6);
    expect(pos).toBeLessThanOrEqual(-0.4);
  });

  it('getCallbacks returns bound methods', () => {
    const cb = env.getCallbacks();
    expect(cb.getObservation()).toHaveLength(2);
    cb.applyAction(2);
    expect(cb.computeReward()).toBeCloseTo(-1);
    expect(cb.isDone()).toBe(false);
    cb.onReset();
    expect(cb.isDone()).toBe(false);
  });

  it('left wall clamps velocity to 0', () => {
    (env as any).position = -1.2;
    (env as any).velocity = -0.01;
    env.applyAction(0); // push left — hits wall
    const [, vel] = env.getObservation();
    expect(vel).toBeGreaterThanOrEqual(0);
  });
});
