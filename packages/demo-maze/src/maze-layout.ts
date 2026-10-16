export interface RectModule {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export interface HazardModule {
  id: string;
  origin: [number, number];
  axis: 'x' | 'z';
  amplitude: number;
  speed: number;
  radius: number;
}

export interface MovingHazard extends HazardModule {
  x: number;
  z: number;
}

export const ARENA_WIDTH = 10.8;
export const ARENA_DEPTH = 8.4;
export const WALL_THICKNESS = 0.32;
export const AGENT_RADIUS = 0.22;
export const SENSOR_RANGE = 3.1;

export const START = { x: -4.35, z: -3.15, heading: 0 };
export const GOAL = { x: 4.35, z: 3.05, radius: 0.42 };
export const DOOR_PAD = { x: -0.45, z: -0.65, radius: 0.55 };

export const WALLS: RectModule[] = [
  { id: 'north-boundary', x: 0, z: -ARENA_DEPTH / 2, w: ARENA_WIDTH, d: WALL_THICKNESS, h: 1.05 },
  { id: 'south-boundary', x: 0, z: ARENA_DEPTH / 2, w: ARENA_WIDTH, d: WALL_THICKNESS, h: 1.05 },
  { id: 'west-boundary', x: -ARENA_WIDTH / 2, z: 0, w: WALL_THICKNESS, d: ARENA_DEPTH, h: 1.05 },
  { id: 'east-boundary', x: ARENA_WIDTH / 2, z: 0, w: WALL_THICKNESS, d: ARENA_DEPTH, h: 1.05 },
  { id: 'training-wall-a', x: -2.95, z: -1.55, w: 0.36, d: 4.15, h: 0.9 },
  { id: 'training-wall-b', x: -1.15, z: 0.52, w: 3.25, d: 0.36, h: 0.9 },
  { id: 'training-wall-c', x: 0.95, z: 1.75, w: 0.36, d: 1.9, h: 0.9 },
  { id: 'training-wall-d-left', x: 0.55, z: -0.72, w: 1.1, d: 0.36, h: 0.9 },
  { id: 'training-wall-d-right', x: 3.2, z: -0.72, w: 2.4, d: 0.36, h: 0.9 },
  { id: 'training-wall-e', x: 3.05, z: 1.5, w: 0.36, d: 2.38, h: 0.9 },
];

export const DOOR: RectModule = { id: 'kinematic-door', x: 1.55, z: -0.72, w: 0.88, d: 0.34, h: 1.05 };

export const HAZARDS: HazardModule[] = [
  { id: 'sweeper-a', origin: [-1.15, -2.55], axis: 'x', amplitude: 0.82, speed: 0.11, radius: 0.28 },
  { id: 'sweeper-b', origin: [2.55, 2.45], axis: 'z', amplitude: 0.72, speed: 0.085, radius: 0.28 },
];

export const CHECKPOINTS = [
  { id: 'upper-turn', x: -3.75, z: 1.1, radius: 0.5 },
  { id: 'door-pad', x: DOOR_PAD.x, z: DOOR_PAD.z, radius: DOOR_PAD.radius },
  { id: 'final-corridor', x: 2.4, z: 3.05, radius: 0.52 },
];

export function movingHazards(stepCount: number): MovingHazard[] {
  return HAZARDS.map((hazard) => {
    const offset = Math.sin(stepCount * hazard.speed) * hazard.amplitude;
    const [originX, originZ] = hazard.origin;
    return {
      ...hazard,
      x: hazard.axis === 'x' ? originX + offset : originX,
      z: hazard.axis === 'z' ? originZ + offset : originZ,
    };
  });
}

export function solidRects(doorOpen: boolean): RectModule[] {
  return doorOpen ? WALLS : [...WALLS, DOOR];
}

export function circleIntersectsRect(x: number, z: number, radius: number, rect: RectModule): boolean {
  const nearestX = clamp(x, rect.x - rect.w / 2, rect.x + rect.w / 2);
  const nearestZ = clamp(z, rect.z - rect.d / 2, rect.z + rect.d / 2);
  return distance(x, z, nearestX, nearestZ) < radius;
}

export function distance(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
