import RAPIER from '@dimforge/rapier3d-compat';
import { PARAMETERS } from './simulation-contract';
import type { Solid } from './simulation-contract';

let initialization: Promise<void> | undefined;
export function initializePhysics(): Promise<void> { return initialization ??= RAPIER.init(); }
export const SOLIDS: readonly Solid[] = Object.freeze([
  { id: 'port', position: { x: 0, y: 0, z: -6 }, size: { x: 24, y: 3, z: 0.4 } },
  { id: 'starboard', position: { x: 0, y: 0, z: 6 }, size: { x: 24, y: 3, z: 0.4 } },
  { id: 'dock-back', position: { x: 10.5, y: 0, z: 0 }, size: { x: 0.4, y: 3, z: 12 } },
  { id: 'module-a', position: { x: -1, y: 0, z: -3.5 }, size: { x: 2, y: 2, z: 2 } },
  { id: 'module-b', position: { x: 3, y: 0, z: 3.5 }, size: { x: 2, y: 2, z: 2 } },
]);
export function createPhysics(offset: number) {
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  world.timestep = PARAMETERS.dt;
  world.numSolverIterations = 8;
  world.integrationParameters.maxCcdSubsteps = 4;
  const body = (x: number, mass: number, size: [number, number, number]) => {
    const rigid = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x + offset, 0, 0)
      .enabledTranslations(true, false, true).enabledRotations(false, true, false)
      .setLinearDamping(0).setAngularDamping(0).setCcdEnabled(true).setCanSleep(false));
    world.createCollider(RAPIER.ColliderDesc.cuboid(...size).setMass(mass).setFriction(0)
      .setRestitution(0.05).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), rigid);
    return rigid;
  };
  const cargo = body(-7, 300, [1, 0.6, 0.8]);
  const drone = body(-4.7, 120, [0.8, 0.4, 0.6]);
  const rotation = { x: 0, y: 0, z: 0, w: 1 };
  const joint = world.createImpulseJoint(RAPIER.JointData.fixed({ x: 1.25, y: 0, z: 0 }, rotation,
    { x: -1.05, y: 0, z: 0 }, rotation), cargo, drone, true);
  joint.setContactsEnabled(false);
  const solids = SOLIDS.map(({ position, size }) => world.createCollider(
    RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
      .setTranslation(position.x, position.y, position.z).setFriction(0).setRestitution(0.05)));
  return { world, cargo, drone, solids, events: new RAPIER.EventQueue(true) };
}
export type Physics = ReturnType<typeof createPhysics>;
