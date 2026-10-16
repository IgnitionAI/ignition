import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { ACTION_DIRECTIONS, ACTION_NAMES, BallThrustEnv } from '../src/ball-thrust-env';
import { BALL_RADIUS, GRAVITY, populateWorld, thrust } from '../src/physics';

const environments: BallThrustEnv[] = [];
beforeAll(async () => { await RAPIER.init(); });
afterEach(() => { environments.splice(0).forEach((env) => env.dispose()); });
function arena(seed = 70) {
  const env = new BallThrustEnv(seed);
  environments.push(env);
  return env;
}

describe('BallThrustEnv — real WASM contract', () => {
  it('recreates the settled seeded state and trajectory after a dirty world', () => {
    const env = arena();
    const initial = env.observe();
    for (let index = 0; index < 30; index++) env.step(3);
    const oldWorld = env.world;
    env.reset();
    expect(env.world).not.toBe(oldWorld);
    expect(env.observe()).toEqual(initial);
    expect(env.steps).toBe(0);
    expect(env.reward()).toBe(0);
    const fresh = arena();
    for (const action of [1, 2, 0, 3, 8, 7, 6]) {
      env.step(action); fresh.step(action);
      expect(env.observe()).toEqual(fresh.observe());
      expect(env.reward()).toBe(fresh.reward());
    }
  });


  it('varies seeds, validates reset atomically and preserves interrupted episode metrics', () => {
    const env = arena();
    const initial = env.observe();
    env.step(2);
    const summary = { return: env.episodeReturn, steps: 1, outcome: 'running', seed: 70, distance: env.telemetry.distance };
    env.reset(71);
    expect(env.lastEpisode).toEqual(summary);
    expect(env.observe()).not.toEqual(initial);
    const state = env.observe();
    for (const seed of [-1, NaN, Infinity, 1.2, 0x100000000]) {
      expect(() => env.reset(seed)).toThrow(RangeError);
      expect(env.observe()).toEqual(state);
    }
    env.reset(70);
    expect(env.observe()).toEqual(initial);
  });

  it.each(ACTION_DIRECTIONS.map((direction, action) => ({ direction, action })))(
    'action $action applies exactly one normalized impulse and six real steps', ({ action, direction }) => {
      const env = arena();
      const world = new RAPIER.World(GRAVITY);
      try {
        const { ball } = populateWorld(world, RAPIER, 70);
        for (let tick = 0; tick < 120; tick++) world.step();
        thrust(ball, direction, 0);
        for (let tick = 0; tick < 6; tick++) world.step();
        env.step(action);
        expect(env.ball.translation()).toEqual(ball.translation());
        expect(env.ball.linvel()).toEqual(ball.linvel());
        expect(env.ball.angvel()).toEqual(ball.angvel());
        expect(env.steps).toBe(1);
        expect(env.telemetry.elapsed).toBeCloseTo(0.1, 12);
        expect(env.lastAction).toBe(action);
      } finally { world.free(); }
    },
  );

  it('exposes the exact action ordering and rejects invalid actions without mutation', () => {
    const env = arena();
    expect(ACTION_NAMES).toEqual(['no-op', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
    expect(env.actions).toBe(9);
    const initial = env.observe();
    for (const action of [-1, 9, 0.5, NaN, Infinity, [], [1]]) {
      expect(() => env.step(action)).toThrow(RangeError);
      expect(env.observe()).toEqual(initial);
      expect(env.steps).toBe(0);
    }
  });

  it('orders and normalizes all 21 observations, clipping extreme values', () => {
    const env = arena();
    env.ball.setTranslation({ x: -3, y: 1.35, z: 3 }, true);
    env.ball.setLinvel({ x: 2, y: -3, z: 4 }, true);
    env.ball.setAngvel({ x: 5, y: -10, z: 15 }, true);
    const observation = env.observe();
    expect(observation).toHaveLength(21);
    const expected = [-0.5, 0.5, 0.2, 0.4, (env.goal.x + 3) / 12, (env.goal.z - 3) / 12,
      0.5, -0.3, 0.2, -0.4, 0.6];
    expected.forEach((value, index) => expect(observation[index]).toBeCloseTo(value, 6));
    expect(observation.slice(19)).toEqual([env.goal.x / 6, env.goal.z / 6]);
    env.ball.setLinvel({ x: 100, y: -100, z: 100 }, true);
    env.ball.setAngvel({ x: -100, y: 100, z: -100 }, true);
    expect(env.observe().slice(2, 4)).toEqual([1, 1]);
    expect(env.observe().slice(7, 11)).toEqual([-1, -1, 1, -1]);
    for (const value of env.observe()) expect(Number.isFinite(value) && Math.abs(value) <= 1).toBe(true);
  });

  it('rays exclude the ball, use center height, normalized diagonals and a 4m cap', () => {
    const env = arena();
    env.ball.setTranslation({ x: 0, y: 0.35, z: 4 }, true);
    const rays = env.observe().slice(11, 19);
    expect(rays[0]).toBe(1); // North obstacle is more than 4m away.
    expect(rays[4]).toBeCloseTo(2 / 4, 5); // South wall inner face z=6.
    expect(rays[3]).toBeCloseTo(2 * Math.SQRT2 / 4, 5);
    expect(rays[5]).toBeCloseTo(2 * Math.SQRT2 / 4, 5);
    env.ball.setTranslation({ x: -3, y: 0.35, z: 1.4 }, true);
    expect(env.observe()[13]).toBeCloseTo(0.7 / 4, 5); // East face of obstacle-a.
    env.ball.setTranslation({ x: -3, y: 1.8, z: 1.4 }, true);
    expect(env.observe()[13]).toBe(1); // Above obstacle, not a floor-level proxy.
  });

  it.each([0, 2, 6])('computes exact dense progress and action costs for action %s', (action) => {
    const env = arena();
    const oldDistance = env.telemetry.distance;
    env.step(action);
    expect(env.reward()).toBeCloseTo(5 * (oldDistance - env.telemetry.distance) - 0.01 - (action ? 0.001 : 0), 12);
    expect(env.episodeReturn).toBe(env.reward());
    expect(env.lastReward).toBe(env.reward());
    expect(env.done()).toBe(false);
  });

  it('awards a goal once, freezes completed episodes and keeps the summary after runner reset', () => {
    const env = arena();
    env.ball.setTranslation({ ...env.goal, y: BALL_RADIUS }, true);
    env.step(0);
    expect(env.reward()).toBeCloseTo(14.99, 9);
    expect(env.outcome).toBe('success');
    expect(env.terminated()).toBe(true);
    expect(env.truncated()).toBe(false);
    const summary = env.lastEpisode;
    const observation = env.observe();
    env.step(3);
    expect(env.observe()).toEqual(observation);
    expect(env.steps).toBe(1);
    expect(env.lastAction).toBe(0);
    expect(env.lastEpisode).toBe(summary);
    env.reset();
    expect(env.lastEpisode).toBe(summary);
    expect(env.outcome).toBe('running');
    expect(env.episodeReturn).toBe(0);
    expect(env.lastReward).toBe(0);
  });

  it('does not count an airborne ball over the goal as success', () => {
    const env = arena();
    env.ball.setTranslation({ ...env.goal, y: 1.5 }, true);
    env.step(0);
    expect(env.done()).toBe(false);
  });

  it.each([
    { x: 6.2, y: 0.35, z: 0 }, { x: -6.2, y: 0.35, z: 0 },
    { x: 0, y: 0.35, z: 6.2 }, { x: 0, y: 0.35, z: -6.2 },
    { x: 0, y: -1.1, z: 0 }, { x: 0, y: 3.1, z: 0 },
  ])('penalizes out-of-bounds failure at %j', (position) => {
    const env = arena();
    env.ball.setTranslation(position, true);
    env.step(0);
    expect(env.outcome).toBe('failure');
    expect(env.reward()).toBeCloseTo(-15.01, 9);
    expect(env.terminated()).toBe(true);
    expect(env.truncated()).toBe(false);
  });

  it('handles non-finite body state without leaking NaN into observations or rewards', () => {
    const env = arena();
    env.ball.setLinvel({ x: NaN, y: 0, z: 0 }, true);
    expect(env.observe().every((value) => Number.isFinite(value) && Math.abs(value) <= 1)).toBe(true);
    env.step(0);
    expect(env.outcome).toBe('failure');
    expect(env.reward()).toBeCloseTo(-15.01, 9);
  });

  it('truncates only at 300 transitions and freezes until reset', () => {
    const env = arena();
    for (let index = 0; index < 299; index++) env.step(0);
    expect(env.done()).toBe(false);
    env.step(0);
    expect(env.steps).toBe(300);
    expect(env.telemetry.elapsed).toBe(30);
    expect(env.outcome).toBe('timeout');
    expect(env.terminated()).toBe(false);
    expect(env.truncated()).toBe(true);
    expect(env.episodeReturn).toBeCloseTo(-3, 9);
    const observation = env.observe();
    env.step(0);
    expect(env.steps).toBe(300);
    expect(env.observe()).toEqual(observation);
  });

  it.each(['success', 'failure'])('prioritizes %s over the time limit', (outcome) => {
    const env = arena();
    for (let index = 0; index < 299; index++) env.step(0);
    env.ball.setTranslation(outcome === 'success' ? { ...env.goal, y: BALL_RADIUS } : { x: 7, y: 0, z: 0 }, true);
    env.step(0);
    expect(env.outcome).toBe(outcome);
    expect(env.terminated()).toBe(true);
    expect(env.truncated()).toBe(false);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('does not tunnel through walls with action %s for an entire episode', (action) => {
    const env = arena();
    for (let step = 0; step < 300; step++) {
      env.step(action);
      const p = env.telemetry.position;
      expect(Math.abs(p.x)).toBeLessThanOrEqual(6 - BALL_RADIUS + 0.03);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(6 - BALL_RADIUS + 0.03);
      expect(p.y).toBeGreaterThan(BALL_RADIUS - 0.03);
    }
    expect(env.outcome).not.toBe('failure');
  });

  it('disposes idempotently and can recreate a world on explicit reset', () => {
    const env = arena();
    const initial = env.observe();
    env.dispose(); env.dispose();
    expect(() => env.step(0)).toThrow(/disposed/);
    env.reset();
    expect(env.observe()).toEqual(initial);
  });
});
