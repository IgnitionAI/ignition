import type RAPIER from '@dimforge/rapier3d-compat';
import type { Pose } from './simulation-contract';
export function wrap(angle: number): number { return Math.atan2(Math.sin(angle), Math.cos(angle)); }
export function pose(body: RAPIER.RigidBody): Pose {
  const rotation = { ...body.rotation() };
  return { position: { ...body.translation() }, rotation, velocity: { ...body.linvel() },
    angularVelocity: { ...body.angvel() }, yaw: Math.atan2(2 * (rotation.w * rotation.y + rotation.x * rotation.z),
      1 - 2 * (rotation.y ** 2 + rotation.z ** 2)) };
}
export function finitePose(value: Pose): boolean {
  return [...Object.values(value.position), ...Object.values(value.rotation), ...Object.values(value.velocity),
    ...Object.values(value.angularVelocity), value.yaw].every(Number.isFinite);
}
