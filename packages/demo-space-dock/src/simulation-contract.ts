import type RAPIER from '@dimforge/rapier3d-compat';
import type { SpaceDockEnv } from './space-dock-env';

export const ACTIONS = ['No-op', 'Avant', 'Arrière', 'Port', 'Tribord', 'Yaw +', 'Yaw −', 'Contre-poussée'] as const;
export type Action = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Outcome = 'running' | 'success' | 'bounds' | 'nonfinite' | 'timeout';
export type XYZ = Readonly<{ x: number; y: number; z: number }>;
export type Pose = Readonly<{ position: XYZ; rotation: Readonly<{ x: number; y: number; z: number; w: number }>; velocity: XYZ; angularVelocity: XYZ; yaw: number }>;
export type Solid = Readonly<{ id: string; position: XYZ; size: XYZ }>;
export type Telemetry = Readonly<{
  drone: Pose; cargo: Pose; distance: number; yawError: number; holdSeconds: number;
  elapsed: number; ticks: number; action: Action; outcome: Outcome; contacts: number;
  force: XYZ; torque: number; reward: number; generation: number;
}>;
export interface SceneProps { env: SpaceDockEnv; compact: boolean; reducedMotion: boolean }
export interface SimulationView {
  readonly drone: RAPIER.RigidBody; readonly cargo: RAPIER.RigidBody; readonly world: RAPIER.World;
  readonly goal: XYZ & { readonly yaw: number }; readonly solids: readonly Solid[];
  readonly telemetry: Telemetry; readonly generation: number;
}
export const PARAMETERS = Object.freeze({ dt: 1 / 60, substeps: 6, timeoutTicks: 5400, holdTicks: 90,
  thrust: 600, lateralThrust: 120, torque: 300, distance: 0.45, yaw: 8 * Math.PI / 180,
  speed: 0.2, angularSpeed: 0.1, brakeLinear: 840, brakeAngular: 1315 });
