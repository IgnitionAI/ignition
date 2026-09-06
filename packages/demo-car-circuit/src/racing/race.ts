import { DrivingWorld, RacingTrack, DRIVING_CONTRACT } from "./driving";

export const RACE_PROTOCOL = Object.freeze({
  id: "circuit-race-v1",
  laps: 3,
  checkpoints: 20,
  rescueTicks: 300,
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
  ticks = 0;
  elapsedTicks = 0;
  constructor({
    count = 1,
    test = false,
    countdown = 3,
  }: { count?: number; test?: boolean; countdown?: number } = {}) {
    if (!Number.isInteger(count) || count < 1 || count > 4)
      throw new Error("Race needs 1–4 drivers");
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
  step(actions: readonly number[]) {
    if (
      actions.length !== this.drivers.length ||
      actions.some((a) => !Number.isInteger(a) || a < 0 || a > 8)
    )
      throw new Error("Supply one valid action per driver");
    if (this.finished) return;
    this.ticks++;
    if (this.ticks <= this.countdownTicks) return;
    this.elapsedTicks++;
    for (const d of this.drivers)
      if (d.finishSeconds === null) d.world.step(actions[d.id]);
    for (let i = 0; i < this.drivers.length; i++)
      for (let j = i + 1; j < this.drivers.length; j++) {
        const da = this.drivers[i],
          db = this.drivers[j];
        if (da.finishSeconds !== null || db.finishSeconds !== null) continue;
        const a = da.world.car,
          b = db.world.car,
          dx = b.x - a.x,
          dz = b.z - a.z,
          dist = Math.hypot(dx, dz);
        if (dist >= 2.4) continue;
        const nx = dist > 1e-6 ? dx / dist : 1,
          nz = dist > 1e-6 ? dz / dist : 0,
          push = (2.4 - dist) / 2;
        a.x -= nx * push;
        a.z -= nz * push;
        b.x += nx * push;
        b.z += nz * push;
        a.speed *= 0.7;
        b.speed *= 0.7;
        da.collisions++;
        db.collisions++;
      }
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
      if (p.distance > this.track.width / 2 && d.offroadTicks === 0)
        d.penaltySeconds += RACE_PROTOCOL.offroadPenalty;
      d.offroadTicks =
        p.distance > this.track.width / 2 ? d.offroadTicks + 1 : 0;
      if (d.offroadTicks >= RACE_PROTOCOL.rescueTicks) {
        const safe = this.track.sample(d.safeProgress);
        c.x = safe.x;
        c.z = safe.z;
        c.angle = safe.angle;
        c.speed = 0;
        c.steering = 0;
        d.lastProgress = safe.progress;
        d.offroadTicks = 0;
        d.rescues++;
        d.penaltySeconds += RACE_PROTOCOL.rescuePenalty;
      }
    }
  }
}
