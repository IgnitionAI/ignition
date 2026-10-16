import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { BALL_RADIUS, GOAL_RADIUS, GRAVITY, HALF_SIZE, SOLIDS, initialState, keyboardDirection, populateWorld, readState, thrust } from '../src/physics';

const worlds: RAPIER.World[] = [];
beforeAll(async () => { await RAPIER.init(); });
afterEach(() => { worlds.splice(0).forEach((world) => world.free()); });

function arena(seed = 70) {
  const world = new RAPIER.World(GRAVITY);
  worlds.push(world);
  return { world, ...populateWorld(world, RAPIER, seed) };
}

function advance(simulation: ReturnType<typeof arena>, ticks: number, direction: readonly [number, number] = [0, 0]) {
  for (let tick = 0; tick < ticks; tick++) {
    thrust(simulation.ball, direction, tick);
    simulation.world.step();
  }
}

describe('Ball Thrust — real Rapier WASM', () => {
  it('recreates initial pose, zero velocities and identical trajectories after a dirty world', () => {
    const dirty = arena();
    advance(dirty, 300, [1, -1]);
    expect(dirty.ball.translation()).not.toEqual(initialState(70).position);
    const reset = arena();
    const fresh = arena();
    expect(readState(reset.ball, reset.goal, 0)).toEqual(readState(fresh.ball, fresh.goal, 0));
    expect(reset.ball.translation()).toEqual(expect.objectContaining({ y: expect.closeTo(BALL_RADIUS + 0.02, 5) }));
    expect(reset.ball.linvel()).toEqual({ x: 0, y: 0, z: 0 });
    expect(reset.ball.angvel()).toEqual({ x: 0, y: 0, z: 0 });
    expect(reset.ball.rotation()).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    for (let tick = 0; tick < 240; tick++) {
      const direction = tick < 120 ? [1, 0] as const : [0, -1] as const;
      thrust(reset.ball, direction, tick);
      thrust(fresh.ball, direction, tick);
      reset.world.step(); fresh.world.step();
      expect(readState(reset.ball, reset.goal, tick)).toEqual(readState(fresh.ball, fresh.goal, tick));
    }
  });

  it('varies seeds reproducibly and rejects invalid seeds', () => {
    expect(initialState(70)).toEqual(initialState(70));
    expect(initialState(71)).not.toEqual(initialState(70));
    for (const seed of [-1, NaN, Infinity, 1.2, 0x100000000]) expect(() => initialState(seed)).toThrow(RangeError);
    for (const seed of [0, 70, 71, 0xffffffff]) {
      const { position, goal } = initialState(seed);
      expect(Math.abs(position.x) + BALL_RADIUS).toBeLessThan(HALF_SIZE);
      expect(Math.abs(position.z) + BALL_RADIUS).toBeLessThan(HALF_SIZE);
      expect(Math.abs(goal.x) + GOAL_RADIUS).toBeLessThan(HALF_SIZE);
      expect(Math.abs(goal.z) + GOAL_RADIUS).toBeLessThan(HALF_SIZE);
    }
  });

  it('uses impulses only, with normalized diagonals and a real no-op', () => {
    const cardinal = arena(); const diagonal = arena();
    const start = cardinal.ball.translation();
    thrust(cardinal.ball, [1, 0], 0);
    thrust(diagonal.ball, [1, -1], 0);
    expect(cardinal.ball.translation()).toEqual(start); // no teleport on input
    expect(Math.hypot(diagonal.ball.linvel().x, diagonal.ball.linvel().z)).toBeCloseTo(cardinal.ball.linvel().x, 6);
    const velocity = cardinal.ball.linvel();
    thrust(cardinal.ball, [0, 0], 6);
    thrust(cardinal.ball, [-1, 0], 1); // only 10 Hz
    expect(cardinal.ball.linvel()).toEqual(velocity);
    cardinal.world.step();
    expect(cardinal.ball.translation().x).toBeGreaterThan(start.x);
  });

  it('settles on the floor and slows through friction/damping without a brake', () => {
    const simulation = arena();
    advance(simulation, 120);
    expect(simulation.ball.translation().y).toBeCloseTo(BALL_RADIUS, 2);
    thrust(simulation.ball, [1, 0], 0);
    advance(simulation, 60);
    const movingSpeed = readState(simulation.ball, simulation.goal, 0).speed;
    advance(simulation, 600);
    expect(readState(simulation.ball, simulation.goal, 0).speed).toBeLessThan(movingSpeed);
  });

  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const;
  it.each([0, 70, 71, 0xffffffff].flatMap((seed) => directions.map(([x, z]) => [seed, x, z] as const)))(
    'keeps seed %s inside walls with 30 seconds of thrust (%s, %s)', (seed, x, z) => {
      const simulation = arena(seed);
      for (let tick = 0; tick < 1800; tick++) {
        thrust(simulation.ball, [x, z], tick);
        simulation.world.step();
        const position = simulation.ball.translation();
        expect(Math.abs(position.x)).toBeLessThanOrEqual(HALF_SIZE - BALL_RADIUS + 0.03);
        expect(Math.abs(position.z)).toBeLessThanOrEqual(HALF_SIZE - BALL_RADIUS + 0.03);
        expect(position.y).toBeGreaterThan(BALL_RADIUS - 0.03);
      }
    },
  );

  it.each(SOLIDS.filter((solid) => solid.id.startsWith('obstacle')))(
    'blocks and rebounds from $id using physical contact', (solid) => {
      const simulation = arena();
      const [x, , z] = solid.position;
      const nearFace = x - solid.size[0] / 2;
      // Test fixture only: put the body on a collision course, never used by gameplay.
      simulation.ball.setTranslation({ x: nearFace - BALL_RADIUS - 0.5, y: BALL_RADIUS, z }, true);
      simulation.ball.setLinvel({ x: 4, y: 0, z: 0 }, true);
      let rebounded = false;
      for (let tick = 0; tick < 45; tick++) {
        simulation.world.step();
        expect(simulation.ball.translation().x).toBeLessThan(nearFace - BALL_RADIUS + 0.03);
        if (simulation.ball.linvel().x < -0.1) rebounded = true;
      }
      expect(rebounded).toBe(true);
    },
  );

  it('detects the goal from the physics body and reports simulated time', () => {
    const simulation = arena();
    simulation.ball.setTranslation({ ...simulation.goal, y: BALL_RADIUS }, true);
    expect(readState(simulation.ball, simulation.goal, 60)).toMatchObject({ reached: true, elapsed: 1 });
    expect(readState(simulation.ball, simulation.goal, 60).distance).toBeCloseTo(0, 6);
  });

  it('maps eight directions, opposing keys, space override and release', () => {
    for (const [keys, expected] of [
      [['ArrowUp'], [0, -1]], [['KeyS'], [0, 1]], [['KeyQ'], [-1, 0]], [['KeyD'], [1, 0]],
      [['KeyW', 'KeyA'], [-1, -1]], [['KeyZ', 'KeyD'], [1, -1]],
      [['ArrowDown', 'ArrowLeft'], [-1, 1]], [['KeyS', 'KeyD'], [1, 1]],
      [['KeyA', 'KeyD'], [0, 0]], [['KeyW', 'Space'], [0, 0]], [[], [0, 0]],
    ] as const) expect(keyboardDirection(new Set(keys))).toEqual(expected);
  });
});
