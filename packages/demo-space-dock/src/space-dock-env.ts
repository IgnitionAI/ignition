import RAPIER from '@dimforge/rapier3d-compat';
import { createPhysics, initializePhysics, SOLIDS } from './physics';
import { finitePose, pose, wrap } from './telemetry';
import { PARAMETERS as P } from './simulation-contract';
import type { TrainingEnv } from '../../core/src/types';
import type { Physics } from './physics';
import type { Action, Outcome, SimulationView, Telemetry, XYZ } from './simulation-contract';

const ZERO = Object.freeze({ x: 0, y: 0, z: 0 });
const clamp = (value: number, limit = 1) => Math.max(-limit, Math.min(limit, value));
function validateSeed(seed: number): void {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('seed must be uint32');
}
function validateAction(action: number | number[]): asserts action is Action {
  if (typeof action !== 'number' || !Number.isInteger(action) || action < 0 || action > 7)
    throw new RangeError('action must be an integer 0..7');
}
// One LCG draw, unsigned uint32 arithmetic; seed zero is supported.
function offset(seed: number): number { return ((Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296 * 0.4 - 0.2; }

export class SpaceDockEnv implements TrainingEnv, SimulationView {
  readonly actions = 8;
  readonly goal = Object.freeze({ x: 6, y: 0, z: 0, yaw: 0 });
  readonly solids = SOLIDS;
  generation = 0;
  private physics: Physics | undefined;
  private seed: number;
  private ticks = 0;
  private holdTicks = 0;
  private outcome: Outcome = 'running';
  private lastReward = 0;
  private action: Action = 0;
  private contacts = 0;
  private activeContacts = new Set<string>();
  private lastForce: XYZ = ZERO;
  private lastTorque = 0;
  private snapshot!: Telemetry;

  private constructor(seed: number) { this.seed = seed; this.reset(seed); }
  static async create(seed = 1): Promise<SpaceDockEnv> {
    validateSeed(seed); await initializePhysics(); return new SpaceDockEnv(seed);
  }
  private get live(): Physics {
    if (!this.physics) throw new Error('environment disposed; reset before reading');
    return this.physics;
  }
  get world(): RAPIER.World { return this.live.world; }
  get drone(): RAPIER.RigidBody { return this.live.drone; }
  get cargo(): RAPIER.RigidBody { return this.live.cargo; }
  get telemetry(): Telemetry { this.live; return structuredClone(this.snapshot); }
  reward(): number { this.live; return this.lastReward; }
  done(): boolean { this.live; return this.outcome !== 'running'; }
  terminated(): boolean { this.live; return this.outcome !== 'running' && this.outcome !== 'timeout'; }
  truncated(): boolean { this.live; return this.outcome === 'timeout'; }
  reset(seed = this.seed): void {
    validateSeed(seed);
    this.dispose(); this.seed = seed; this.physics = createPhysics(offset(seed)); this.generation++;
    this.ticks = 0; this.holdTicks = 0; this.outcome = 'running'; this.lastReward = 0;
    this.action = 0; this.contacts = 0; this.activeContacts.clear(); this.lastForce = ZERO; this.lastTorque = 0;
    this.refresh();
  }
  dispose(): void {
    if (!this.physics) return;
    this.physics.events.free(); this.physics.world.free(); this.physics = undefined;
  }
  private refresh(): void {
    const cargo = pose(this.cargo), drone = pose(this.drone);
    this.snapshot = { cargo, drone, distance: Math.hypot(6 - cargo.position.x, cargo.position.z),
      yawError: wrap(-cargo.yaw), ticks: this.ticks, elapsed: this.ticks * P.dt,
      holdSeconds: this.holdTicks * P.dt, action: this.action, outcome: this.outcome, contacts: this.contacts,
      force: { ...this.lastForce }, torque: this.lastTorque, reward: this.lastReward, generation: this.generation };
  }
  private checkTerminal(countHold: boolean): void {
    const cargo = pose(this.cargo), drone = pose(this.drone);
    if (!finitePose(cargo) || !finitePose(drone)) { this.outcome = 'nonfinite'; return; }
    if ([cargo, drone].some(({ position }) => Math.abs(position.x) > 14 || Math.abs(position.z) > 9)) {
      this.outcome = 'bounds'; return;
    }
    const inside = Math.hypot(6 - cargo.position.x, cargo.position.z) <= P.distance &&
      Math.abs(wrap(-cargo.yaw)) <= P.yaw && Math.hypot(cargo.velocity.x, cargo.velocity.z) <= P.speed &&
      Math.abs(cargo.angularVelocity.y) <= P.angularSpeed;
    if (!inside) this.holdTicks = 0;
    if (!countHold) return;
    this.holdTicks = inside ? this.holdTicks + 1 : 0;
    if (this.holdTicks >= P.holdTicks) this.outcome = 'success';
    else if (this.ticks >= P.timeoutTicks) this.outcome = 'timeout';
  }
  private clearForces(): void {
    for (const body of [this.drone, this.cargo]) { body.resetForces(true); body.resetTorques(true); }
  }
  private apply(action: Action): number {
    this.clearForces();
    const yaw = pose(this.drone).yaw;
    let x = action === 1 ? P.thrust : action === 2 ? -P.thrust : 0;
    let z = action === 3 ? -P.lateralThrust : action === 4 ? P.lateralThrust : 0;
    let torque = action === 5 ? P.torque : action === 6 ? -P.torque : 0;
    const worldX = Math.cos(yaw) * x + Math.sin(yaw) * z;
    z = -Math.sin(yaw) * x + Math.cos(yaw) * z; x = worldX;
    if (action === 7) {
      const velocity = this.drone.linvel();
      const scale = Math.min(P.brakeLinear, P.thrust / Math.max(Math.hypot(velocity.x, velocity.z), 1e-12));
      x = -velocity.x * scale; z = -velocity.z * scale;
      torque = clamp(-P.brakeAngular * this.drone.angvel().y, P.torque);
    }
    this.lastForce = { x, y: 0, z }; this.lastTorque = torque;
    this.drone.addForce(this.lastForce, true); this.drone.addTorque({ x: 0, y: torque, z: 0 }, true);
    return (Math.hypot(x, z) / P.thrust + Math.abs(torque) / P.torque) * P.dt / 0.1;
  }
  private readContacts(): number {
    let count = 0;
    this.live.events.drainCollisionEvents((first, second, started) => {
      const key = [first, second].sort((a, b) => a - b).join(':');
      if (started && !this.activeContacts.has(key)) { this.activeContacts.add(key); count++; this.contacts++; }
      if (!started) this.activeContacts.delete(key);
    });
    return count;
  }
  step(action: number | number[]): void {
    validateAction(action); if (this.done()) return;
    this.action = action; this.checkTerminal(false);
    const before = this.snapshot; const initialTick = this.ticks;
    let effort = 0, collisions = 0;
    for (let index = 0; index < P.substeps && this.outcome === 'running'; index++) {
      effort += this.apply(action); this.world.step(this.live.events); this.ticks++;
      collisions += this.readContacts(); this.checkTerminal(true);
    }
    this.clearForces(); this.refresh();
    const finite = this.outcome !== 'nonfinite';
    this.lastReward = (finite ? 2 * (before.distance - this.snapshot.distance) +
      0.25 * (Math.cos(this.snapshot.yawError) - Math.cos(before.yawError)) : 0) -
      0.1 * (this.ticks - initialTick) * P.dt - 0.002 * effort - collisions +
      (this.outcome === 'success' ? 30 : this.outcome === 'bounds' || this.outcome === 'nonfinite' ? -30 : 0);
    this.refresh();
  }
  private rays(): number[] {
    const yaw = pose(this.drone).yaw;
    return Array.from({ length: 8 }, (_, index) => {
      const angle = yaw + index * Math.PI / 4;
      const direction = { x: Math.cos(angle), y: 0, z: -Math.sin(angle) };
      let nearest = 8;
      for (const [body, halfX, halfZ] of [[this.cargo, 1, 0.8], [this.drone, 0.8, 0.6]] as const) {
        const localAngle = angle - pose(body).yaw;
        const surface = Math.min(halfX / Math.max(Math.abs(Math.cos(localAngle)), 1e-12),
          halfZ / Math.max(Math.abs(Math.sin(localAngle)), 1e-12));
        const ray = new RAPIER.Ray(body.translation(), direction);
        // Query colliders directly: no stale world query pipeline after reset; both joined bodies excluded.
        for (const solid of this.live.solids) {
          const hit = solid.castRayAndGetNormal(ray, 8 + surface, true);
          if (hit) nearest = Math.min(nearest, Math.max(0, hit.timeOfImpact - surface));
        }
      }
      return nearest / 8;
    });
  }
  observe(): number[] {
    this.live;
    const t = this.snapshot, c = t.cargo, d = t.drone;
    if (!finitePose(c) || !finitePose(d)) return Array(26).fill(0);
    return [(6 - c.position.x) / 28, -c.position.z / 18, Math.sin(t.yawError), Math.cos(t.yawError),
      c.velocity.x / 10, c.velocity.z / 10, c.angularVelocity.y / 4, d.velocity.x / 10, d.velocity.z / 10,
      d.angularVelocity.y / 4, Math.sin(d.yaw), Math.cos(d.yaw), c.position.x / 14, c.position.z / 9,
      d.position.x / 14, d.position.z / 9, (P.timeoutTicks - t.ticks) / P.timeoutTicks,
      this.holdTicks / P.holdTicks, ...this.rays()].map(value => clamp(value));
  }
}
export { SpaceDockEnv as DockEnv };
