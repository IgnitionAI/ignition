import { DrivingWorld, RacingTrack, DRIVING_CONTRACT } from "./driving";

export const RACE_PROTOCOL = Object.freeze({
  id: "circuit-race-v2",
  laps: 3,
  checkpoints: 20,
  rescueTicks: 300,
  immobilizationRadius: 1,
  rescuePenalty: 5,
  offroadPenalty: 2,
  maxTicks: 60 * 300,
  trainingTrack: "alpine-park-v1",
  heldOutTrack: "harbour-test-v1",
  evaluationSeeds: [101, 307, 509],
});
export interface RaceDriver {
  id: number;
  world: DrivingWorld;
  laps: number;
  gates: number;
  lastProgress: number;
  safeProgress: number;
  offroadTicks: number;
  stationaryTicks: number;
  motionAnchor: { x: number; z: number };
  penaltySeconds: number;
  rescues: number;
  collisions: number;
  finishSeconds: number | null;
}
/** All decisions are supplied as one batch, before any physics is advanced. */
export class RaceWorld {
  readonly track: RacingTrack;
  readonly drivers: RaceDriver[];
  readonly countdownTicks: number;
  readonly ghost: boolean;
  get rulesId() { return this.ghost ? "circuit-race-v2-ghost-v1" : RACE_PROTOCOL.id; }
  ticks = 0;
  elapsedTicks = 0;
  constructor({
    count = 1,
    test = false,
    countdown = 3,
    ghost = false,
  }: { count?: number; test?: boolean; countdown?: number; ghost?: boolean } = {}) {
    if (!Number.isInteger(count) || count < 1 || count > 4)
      throw new Error("Race needs 1–4 drivers");
    this.ghost = ghost;
    this.track = new RacingTrack(test);
    this.countdownTicks = Math.round(countdown / DRIVING_CONTRACT.dt);
    this.drivers = Array.from({ length: count }, (_, id) => {
      const world = new DrivingWorld(this.track);
      const p = this.track.sample(0);
      const side = count === 1 ? 0 : id % 2 ? 1.6 : -1.6;
      const back = Math.floor(id / 2) * 5;
      world.car.x += -Math.sin(p.angle) * side - Math.cos(p.angle) * back;
      world.car.z += Math.cos(p.angle) * side - Math.sin(p.angle) * back;
      return {
        id,
        world,
        laps: 0,
        gates: 0,
        lastProgress: this.track.nearest(world.car.x, world.car.z).progress,
        safeProgress: 0,
        offroadTicks: 0,
        stationaryTicks: 0,
        motionAnchor: { x: world.car.x, z: world.car.z },
        penaltySeconds: 0,
        rescues: 0,
        collisions: 0,
        finishSeconds: null,
      };
    });
  }
  get finished() {
    return (
      this.drivers.every((d) => d.finishSeconds !== null) ||
      this.elapsedTicks >= RACE_PROTOCOL.maxTicks
    );
  }
  get countdown() {
    return Math.max(
      0,
      (this.countdownTicks - this.ticks) * DRIVING_CONTRACT.dt,
    );
  }
  get standings() {
    return [...this.drivers].sort((a, b) => {
      if (a.finishSeconds !== null || b.finishSeconds !== null)
        return (
          (a.finishSeconds ?? Infinity) - (b.finishSeconds ?? Infinity) ||
          a.id - b.id
        );
      const remaining = (d: RaceDriver) =>
        (((d.gates + 1) % RACE_PROTOCOL.checkpoints) /
          RACE_PROTOCOL.checkpoints -
          d.lastProgress +
          1) %
        1;
      return b.gates - a.gates || remaining(a) - remaining(b) || a.id - b.id;
    });
  }
  private resolveContacts(railContacts: Set<number>) {
    const pairs = new Set<string>();
    const diameter = 2 * DRIVING_CONTRACT.carRadius;
    // Bounded constraint passes keep a rail projection from undoing separation.
    // Contact metrics and impact damping count once per pair, not per solver pass.
    for (let iteration = 0; iteration < 16; iteration++) {
      const moved = new Set<number>();
      for (let i = 0; i < this.drivers.length; i++) for (let j = i + 1; j < this.drivers.length; j++) {
        const da = this.drivers[i], db = this.drivers[j];
        if (da.finishSeconds !== null || db.finishSeconds !== null) continue;
        const a = da.world.car, b = db.world.car, dx = b.x - a.x, dz = b.z - a.z, dist = Math.hypot(dx, dz);
        if (dist >= diameter - 1e-4) continue;
        const nx = dist > 1e-6 ? dx / dist : 1, nz = dist > 1e-6 ? dz / dist : 0, push = (diameter - dist) / 2;
        a.x -= nx * push; a.z -= nz * push;
        b.x += nx * push; b.z += nz * push;
        moved.add(i); moved.add(j);
        const pair = `${i}:${j}`;
        if (!pairs.has(pair)) {
          pairs.add(pair); a.speed *= 0.7; b.speed *= 0.7;
          da.collisions++; db.collisions++;
        }
      }
      if (moved.size === 0) break;
      for (const id of moved) if (this.drivers[id].world.constrainToTrack()) railContacts.add(id);
    }
  }
  /** Rejoin at the last earned checkpoint; recovery never awards progress. */
  rescue(id: number) {
    const d = this.drivers[id];
    if (!d || this.finished || d.finishSeconds !== null || this.countdown > 0) return;
    const c = d.world.car;
    const safe = this.track.sample(d.safeProgress);
    c.x = safe.x;
    c.z = safe.z;
    c.angle = safe.angle;
    c.speed = 0;
    c.steering = 0;
    d.lastProgress = safe.progress;
    d.offroadTicks = 0;
    d.stationaryTicks = 0;
    d.motionAnchor = { x: c.x, z: c.z };
    d.rescues++;
    d.penaltySeconds += RACE_PROTOCOL.rescuePenalty;
  }
  step(actions: readonly number[], humanId?: number) {
    if (
      actions.length !== this.drivers.length ||
      actions.some((a) => !Number.isInteger(a) || a < 0 || a > 8)
    )
      throw new Error("Supply one valid action per driver");
    if (this.finished) return;
    this.ticks++;
    if (this.ticks <= this.countdownTicks) return;
    this.elapsedTicks++;
    const railContacts = new Set<number>();
    for (const d of this.drivers)
      if (d.finishSeconds === null && d.world.step(actions[d.id], d.id === humanId)) railContacts.add(d.id);
    if (!this.ghost) this.resolveContacts(railContacts);
    for (const id of railContacts) this.drivers[id].collisions++;
    for (const d of this.drivers) {
      if (d.finishSeconds !== null) continue;
      const c = d.world.car,
        p = this.track.nearest(c.x, c.z);
      let delta = p.progress - d.lastProgress;
      if (delta > 0.5) delta -= 1;
      if (delta < -0.5) delta += 1;
      const forward = delta > 0 && delta * this.track.length < 2;
      const next =
        ((d.gates + 1) % RACE_PROTOCOL.checkpoints) / RACE_PROTOCOL.checkpoints;
      const distanceToGate = (next - d.lastProgress + 1) % 1;
      if (
        p.distance <= this.track.width / 2 &&
        forward &&
        distanceToGate > 0 &&
        distanceToGate <= delta + 1e-8
      ) {
        d.gates++;
        d.safeProgress = next;
        d.laps = Math.floor(d.gates / RACE_PROTOCOL.checkpoints);
        if (d.laps >= RACE_PROTOCOL.laps)
          d.finishSeconds =
            this.elapsedTicks * DRIVING_CONTRACT.dt + d.penaltySeconds;
      }
      d.lastProgress = p.progress;
      if (d.finishSeconds !== null) continue;
      if (p.distance > this.track.width / 2 && d.offroadTicks === 0)
        d.penaltySeconds += RACE_PROTOCOL.offroadPenalty;
      d.offroadTicks =
        p.distance > this.track.width / 2 ? d.offroadTicks + 1 : 0;
      // A moving excursion is recoverable. Rescue only a car remaining within
      // one metre for five seconds, including a car pinned against traffic/rails.
      if (Math.hypot(c.x - d.motionAnchor.x, c.z - d.motionAnchor.z) >= RACE_PROTOCOL.immobilizationRadius) {
        d.motionAnchor = { x: c.x, z: c.z };
        d.stationaryTicks = 0;
      } else d.stationaryTicks++;
      if (d.stationaryTicks >= RACE_PROTOCOL.rescueTicks) {
        this.rescue(d.id);
      }
    }
  }
}
