import { describe, expect, it } from 'vitest';
import { MazeEnv } from '../src/maze-env';
import {
  AGENT_RADIUS,
  ARENA_DEPTH,
  ARENA_WIDTH,
  DOOR_PAD,
  GOAL,
  START,
  circleIntersectsRect,
  distance,
  solidRects,
} from '../src/maze-layout';

describe('MazeEnv', () => {
  it('implements the TrainingEnv contract with a stable observation shape', () => {
    const env = new MazeEnv();

    expect(env.actions).toEqual(['forward', 'turnLeft', 'turnRight', 'strafeLeft', 'strafeRight', 'wait']);
    expect(env.observe()).toHaveLength(16);
    expect(typeof env.step).toBe('function');
    expect(typeof env.reward).toBe('function');
    expect(typeof env.done).toBe('function');
    expect(typeof env.reset).toBe('function');
  });

  it('moves forward and rewards progress toward the goal', () => {
    const env = new MazeEnv();
    const before = distance(env.agentX, env.agentZ, GOAL.x, GOAL.z);

    env.step(0);

    expect(distance(env.agentX, env.agentZ, GOAL.x, GOAL.z)).toBeLessThan(before);
    expect(env.reward()).toBeGreaterThan(-0.02);
  });

  it('penalizes repeated wall contact without moving through the wall', () => {
    const env = new MazeEnv();
    env.heading = Math.PI;

    for (let i = 0; i < 8; i++) env.step(0);

    expect(env.lastActionBlocked).toBe(true);
    expect(env.agentX).toBeGreaterThan(-5.2);
    expect(env.reward()).toBeLessThan(-0.05);
  });

  it('opens the door after the pressure pad is reached', () => {
    const env = new MazeEnv();
    env.agentX = DOOR_PAD.x;
    env.agentZ = DOOR_PAD.z;

    env.step(5);

    expect(env.doorOpen).toBe(true);
    expect(env.observe()[14]).toBe(1);
  });

  it('detects hazard contact and applies a penalty', () => {
    const env = new MazeEnv();
    const hazard = env.snapshot().hazards[0];
    env.agentX = hazard.x;
    env.agentZ = hazard.z;
    (env as unknown as { previousGoalDistance: number }).previousGoalDistance = distance(hazard.x, hazard.z, GOAL.x, GOAL.z);

    env.step(5);

    expect(env.lastHazardHit).toBe(true);
    expect(env.reward()).toBeLessThan(-0.15);
  });

  it('resets state, trail, door, and counters', () => {
    const env = new MazeEnv();
    env.step(0);
    env.agentX = DOOR_PAD.x;
    env.agentZ = DOOR_PAD.z;
    env.step(5);

    env.reset();

    expect(env.agentX).toBe(START.x);
    expect(env.agentZ).toBe(START.z);
    expect(env.heading).toBe(START.heading);
    expect(env.stepCount).toBe(0);
    expect(env.doorOpen).toBe(false);
    expect(env.trail).toEqual([]);
    expect(env.snapshot().lastAction).toBe('reset');
  });

  it('keeps a reachable walking route from spawn to goal', () => {
    expect(hasRouteToGoal()).toBe(true);
  });
});

function hasRouteToGoal(): boolean {
  const cellSize = 0.16;
  const cols = Math.floor(ARENA_WIDTH / cellSize) + 1;
  const rows = Math.floor(ARENA_DEPTH / cellSize) + 1;
  const start = toCell(START.x, START.z);
  const queue: Array<[number, number]> = [start];
  const visited = new Set([start.join(',')]);
  const solids = solidRects(true);

  while (queue.length > 0) {
    const [col, row] = queue.shift()!;
    const [x, z] = toWorld(col, row);
    if (distance(x, z, GOAL.x, GOAL.z) < GOAL.radius + 0.16) return true;

    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nextCol = col + dc;
      const nextRow = row + dr;
      const key = `${nextCol},${nextRow}`;
      if (nextCol < 0 || nextRow < 0 || nextCol >= cols || nextRow >= rows || visited.has(key)) continue;
      const [nextX, nextZ] = toWorld(nextCol, nextRow);
      if (solids.some((rect) => circleIntersectsRect(nextX, nextZ, AGENT_RADIUS, rect))) continue;
      visited.add(key);
      queue.push([nextCol, nextRow]);
    }
  }

  return false;

  function toCell(x: number, z: number): [number, number] {
    return [
      Math.round((x + ARENA_WIDTH / 2) / cellSize),
      Math.round((z + ARENA_DEPTH / 2) / cellSize),
    ];
  }

  function toWorld(col: number, row: number): [number, number] {
    return [
      col * cellSize - ARENA_WIDTH / 2,
      row * cellSize - ARENA_DEPTH / 2,
    ];
  }
}
