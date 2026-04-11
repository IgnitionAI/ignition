import { describe, it, expect, beforeEach } from 'vitest';
import { GridWorldEnv } from '../src/gridworld';

describe('GridWorldEnv', () => {
  let env: GridWorldEnv;

  beforeEach(() => {
    env = new GridWorldEnv(7);
  });

  it('agent starts at (0,0)', () => {
    expect(env.agentRow).toBe(0);
    expect(env.agentCol).toBe(0);
  });

  it('target is at (gridSize-1, gridSize-1)', () => {
    expect(env.targetRow).toBe(6);
    expect(env.targetCol).toBe(6);
  });

  it('observe() returns normalized [row, col, targetRow, targetCol]', () => {
    const obs = env.observe();
    expect(obs).toHaveLength(4);
    expect(obs[0]).toBe(0);   // row=0 / 6 = 0
    expect(obs[1]).toBe(0);   // col=0 / 6 = 0
    expect(obs[2]).toBe(1);   // targetRow=6 / 6 = 1
    expect(obs[3]).toBe(1);   // targetCol=6 / 6 = 1
  });

  it('step(1) moves agent right (col+1)', () => {
    env.step(1); // right
    expect(env.agentRow).toBe(0);
    expect(env.agentCol).toBe(1);
  });

  it('step(2) moves agent down (row+1)', () => {
    env.step(2); // down
    expect(env.agentRow).toBe(1);
    expect(env.agentCol).toBe(0);
  });

  it('step(0) at top edge stays at row=0', () => {
    env.step(0); // up — clamped
    expect(env.agentRow).toBe(0);
  });

  it('step(3) at left edge stays at col=0', () => {
    env.step(3); // left — clamped
    expect(env.agentCol).toBe(0);
  });

  it('reward is -0.1 per step, +10 at goal', () => {
    expect(env.reward()).toBe(-0.1);
    // Move to goal
    for (let i = 0; i < 6; i++) env.step(2); // down 6
    for (let i = 0; i < 6; i++) env.step(1); // right 6
    expect(env.agentRow).toBe(6);
    expect(env.agentCol).toBe(6);
    expect(env.reward()).toBe(10);
  });

  it('done() returns true when agent reaches target', () => {
    expect(env.done()).toBe(false);
    for (let i = 0; i < 6; i++) env.step(2);
    for (let i = 0; i < 6; i++) env.step(1);
    expect(env.done()).toBe(true);
  });

  it('done() returns true after step limit (100)', () => {
    for (let i = 0; i < 100; i++) {
      env.step(0); // stay at 0,0 — hitting wall
    }
    expect(env.done()).toBe(true);
  });

  it('reset() moves agent to (0,0) and clears trail', () => {
    env.step(1);
    env.step(2);
    expect(env.trail.length).toBeGreaterThan(0);
    env.reset();
    expect(env.agentRow).toBe(0);
    expect(env.agentCol).toBe(0);
    expect(env.trail).toHaveLength(0);
    expect(env.stepCount).toBe(0);
  });

  it('trail records visited positions', () => {
    env.step(1);
    env.step(2);
    expect(env.trail).toHaveLength(2);
    expect(env.trail[0]).toEqual([0, 0]); // where agent was before step 1
    expect(env.trail[1]).toEqual([0, 1]); // where agent was before step 2
  });
});
