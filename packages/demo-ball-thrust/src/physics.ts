import type Rapier from '@dimforge/rapier3d-compat';

export const TIME_STEP = 1 / 60;
export const THRUST_INTERVAL = 6;
export const IMPULSE = 0.65; // N·s, delivered at 10 Hz while a direction is held.
export const BALL_RADIUS = 0.35;
export const HALF_SIZE = 6;
export const GOAL_RADIUS = 0.7;
export const GRAVITY = { x: 0, y: -9.81, z: 0 };
export const MATERIAL = { friction: 0.65, restitution: 0.55 };
// Predict a full 60 Hz sweep at arena thrust speeds, avoiding late wall contacts.
export const SOLVER = { numSolverIterations: 8, maxCcdSubsteps: 4, predictionDistance: 0.12 };
export type Direction = readonly [number, number];
export type Vector = { x: number; y: number; z: number };

export const SOLIDS = [
  { id: 'floor', position: [0, -0.25, 0], size: [12.8, 0.5, 12.8] },
  { id: 'north', position: [0, 1, -6.2], size: [12.8, 2, 0.4] },
  { id: 'south', position: [0, 1, 6.2], size: [12.8, 2, 0.4] },
  { id: 'west', position: [-6.2, 1, 0], size: [0.4, 2, 12] },
  { id: 'east', position: [6.2, 1, 0], size: [0.4, 2, 12] },
  { id: 'obstacle-a', position: [-1.8, 0.65, 1.4], size: [1, 1.3, 3] },
  { id: 'obstacle-b', position: [1.25, 0.65, -1.6], size: [3, 1.3, 1] },
  { id: 'obstacle-c', position: [2.6, 0.65, 2.3], size: [1.2, 1.3, 1.2] },
] as const;

/** Seed is an unsigned 32-bit integer; spawn/goal stay in obstacle-free corners. */
export function initialState(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('La graine doit être un entier entre 0 et 4294967295.');
  }
  let state = seed;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  return {
    position: { x: -4.5 + random() * 0.7, y: BALL_RADIUS + 0.02, z: 4 + random() * 0.7 },
    goal: { x: 4 + random() * 0.7, y: 0, z: -4.5 + random() * 0.7 },
  };
}

/** Same factory in the R3F Physics world and headless WASM tests. */
export function populateWorld(world: Rapier.World, rapier: typeof Rapier, seed: number) {
  const { position, goal } = initialState(seed);
  world.timestep = TIME_STEP;
  world.integrationParameters.maxCcdSubsteps = SOLVER.maxCcdSubsteps;
  world.integrationParameters.normalizedPredictionDistance = SOLVER.predictionDistance;
  world.numSolverIterations = SOLVER.numSolverIterations;
  for (const solid of SOLIDS) {
    const [x, y, z] = solid.position;
    const [width, height, depth] = solid.size;
    const body = world.createRigidBody(rapier.RigidBodyDesc.fixed().setTranslation(x, y, z));
    world.createCollider(
      rapier.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
        .setFriction(MATERIAL.friction).setRestitution(MATERIAL.restitution),
      body,
    );
  }
  const ball = world.createRigidBody(
    rapier.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.25).setAngularDamping(0.4).setCcdEnabled(true),
  );
  world.createCollider(
    rapier.ColliderDesc.ball(BALL_RADIUS).setMass(1)
      .setFriction(MATERIAL.friction).setRestitution(MATERIAL.restitution),
    ball,
  );
  return { ball, goal };
}

/** Normalization gives diagonals the same impulse as cardinal directions. */
export function thrust(ball: Rapier.RigidBody, direction: Direction, tick: number) {
  const [x, z] = direction;
  const length = Math.hypot(x, z);
  if (length === 0 || tick % THRUST_INTERVAL !== 0) return;
  ball.applyImpulse({ x: x / length * IMPULSE, y: 0, z: z / length * IMPULSE }, true);
}

/** All HUD data comes from Rapier; elapsed time is simulation time, not wall time. */
export function readState(ball: Rapier.RigidBody, goal: Vector, tick: number) {
  const position = ball.translation();
  const velocity = ball.linvel();
  const distance = Math.hypot(position.x - goal.x, position.z - goal.z);
  return {
    position: { ...position }, velocity: { ...velocity }, distance,
    speed: Math.hypot(velocity.x, velocity.y, velocity.z),
    elapsed: tick * TIME_STEP,
    reached: distance <= GOAL_RADIUS && position.y < BALL_RADIUS + 0.15,
  };
}

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: [0, -1], KeyW: [0, -1], KeyZ: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], KeyQ: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};
export const CONTROL_KEYS = new Set([...Object.keys(KEY_DIRECTIONS), 'Space']);

/** Space overrides held directions: no impulse, not a brake or velocity assignment. */
export function keyboardDirection(keys: ReadonlySet<string>): Direction {
  if (keys.has('Space')) return [0, 0];
  let x = 0;
  let z = 0;
  for (const key of keys) {
    const direction = KEY_DIRECTIONS[key];
    if (direction) { x += direction[0]; z += direction[1]; }
  }
  return [Math.sign(x), Math.sign(z)];
}
