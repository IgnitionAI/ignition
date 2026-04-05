import { describe, it, expect, beforeEach } from 'vitest';
import { GridWorldEnv, createGridWorld } from './index';

describe('GridWorldEnv', () => {
  let env: GridWorldEnv;

  beforeEach(() => {
    env = createGridWorld(5);
  });

  it('initial observation is [0, 0]', () => {
    expect(env.getObservation()).toEqual([0, 0]);
  });

  it('isDone is false on reset', () => {
    expect(env.isDone()).toBe(false);
  });

  it('moves right correctly', () => {
    env.applyAction(3); // right
    const obs = env.getObservation();
    expect(obs[0]).toBeCloseTo(0);    // row unchanged
    expect(obs[1]).toBeCloseTo(0.25); // col 1/4
  });

  it('moves down correctly', () => {
    env.applyAction(1); // down
    const obs = env.getObservation();
    expect(obs[0]).toBeCloseTo(0.25); // row 1/4
    expect(obs[1]).toBeCloseTo(0);
  });

  it('returns -0.01 reward for a normal step', () => {
    env.applyAction(1); // down (valid move from (0,0))
    expect(env.computeReward()).toBeCloseTo(-0.01);
  });

  it('returns -1.0 reward for hitting a wall', () => {
    env.applyAction(0); // up — already at row 0, wall
    expect(env.computeReward()).toBeCloseTo(-1.0);
    // Position unchanged
    expect(env.getObservation()).toEqual([0, 0]);
  });

  it('left wall from (0,0) returns -1.0', () => {
    env.applyAction(2); // left
    expect(env.computeReward()).toBeCloseTo(-1.0);
  });

  it('reaches goal at (4,4) and returns +1.0 reward', () => {
    // Walk: right x4, down x4
    for (let i = 0; i < 4; i++) env.applyAction(3); // right
    for (let i = 0; i < 4; i++) env.applyAction(1); // down
    expect(env.computeReward()).toBeCloseTo(1.0);
    expect(env.isDone()).toBe(true);
  });

  it('resets state correctly', () => {
    env.applyAction(1);
    env.onReset();
    expect(env.getObservation()).toEqual([0, 0]);
    expect(env.isDone()).toBe(false);
  });

  it('getCallbacks returns bound methods', () => {
    const cb = env.getCallbacks();
    expect(cb.getObservation()).toEqual([0, 0]);
    cb.applyAction(3); // right
    expect(cb.computeReward()).toBeCloseTo(-0.01);
    expect(cb.isDone()).toBe(false);
    cb.onReset();
    expect(cb.getObservation()).toEqual([0, 0]);
  });

  it('works with n=1 (single-cell grid, immediate done)', () => {
    const tiny = createGridWorld(1);
    expect(tiny.getObservation()).toEqual([0, 0]);
    // (0,0) is already the goal → any action that stays in bounds completes it
    // But with n=1, all moves hit walls except... there are no valid moves.
    // Let's check: applying any action results in a wall (-1.0), not done.
    tiny.applyAction(1);
    expect(tiny.computeReward()).toBeCloseTo(-1.0);
    expect(tiny.isDone()).toBe(false);
  });
});
