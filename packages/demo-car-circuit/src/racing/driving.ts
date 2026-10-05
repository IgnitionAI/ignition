import { CatmullRomCurve3, Vector3 } from "three";

export const DRIVING_CONTRACT = Object.freeze({
  id: "circuit-racing-v2",
  dt: 1 / 60,
  actionCount: 9,
  maxSpeed: 32,
  carRadius: 1.2,
  barrierOffset: 7,
  barrierThickness: 0.45,
});
export interface RoadSample {
  x: number;
  z: number;
  angle: number;
  distance: number;
  progress: number;
}
export class RacingTrack {
  readonly width = 9;
  readonly points: Vector3[];
  readonly length: number;
  readonly id: string;
  constructor(test = false) {
    this.id = test ? "harbour-test-v1" : "alpine-park-v1";
    const coords = test
      ? [
          [-60, -35],
          [0, -40],
          [55, -25],
          [60, 20],
          [20, 35],
          [0, 10],
          [-40, 40],
          [-65, 10],
        ]
      : [
          [-30, -32],
          [20, -32],
          [55, -20],
          [60, 10],
          [30, 20],
          [12, 40],
          [-25, 40],
          [-55, 20],
          [-62, -10],
          [-55, -30],
        ];
    const curve = new CatmullRomCurve3(
      coords.map(([x, z]) => new Vector3(x, 0, z)),
      true,
      "catmullrom",
      0.35,
    );
    this.points = curve.getSpacedPoints(400);
    this.length = curve.getLength();
  }
  sample(progress: number): RoadSample {
    const p = (((progress % 1) + 1) % 1) * 400,
      i = Math.floor(p),
      a = this.points[i],
      b = this.points[i + 1],
      t = p - i;
    return {
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
      angle: Math.atan2(b.z - a.z, b.x - a.x),
      distance: 0,
      progress: p / 400,
    };
  }
  nearest(x: number, z: number): RoadSample {
    let best = Infinity,
      result = this.sample(0);
    for (let i = 0; i < 400; i++) {
      const a = this.points[i],
        b = this.points[i + 1],
        dx = b.x - a.x,
        dz = b.z - a.z;
      const t = Math.max(
        0,
        Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)),
      );
      const px = a.x + t * dx,
        pz = a.z + t * dz,
        d = Math.hypot(x - px, z - pz);
      if (d < best) {
        best = d;
        result = {
          x: px,
          z: pz,
          angle: Math.atan2(dz, dx),
          distance: d,
          progress: (i + t) / 400,
        };
      }
    }
    return result;
  }
}
export interface CarState {
  x: number;
  z: number;
  angle: number;
  speed: number;
  steering: number;
}
export class DrivingWorld {
  readonly track: RacingTrack;
  car: CarState;
  ticks = 0;
  constructor(track = new RacingTrack()) {
    this.track = track;
    this.car = this.start();
  }
  private start(): CarState {
    const p = this.track.sample(0);
    return { x: p.x, z: p.z, angle: p.angle, speed: 0, steering: 0 };
  }
  reset() {
    this.car = this.start();
    this.ticks = 0;
  }
  /** Project the collision circle inside the continuous rail and remove outward velocity. */
  constrainToTrack(): boolean {
    const c = this.car, p = this.track.nearest(c.x, c.z);
    const limit = DRIVING_CONTRACT.barrierOffset - DRIVING_CONTRACT.barrierThickness / 2 - DRIVING_CONTRACT.carRadius;
    if (p.distance <= limit) return false;
    const nx = (c.x - p.x) / p.distance, nz = (c.z - p.z) / p.distance;
    c.x = p.x + nx * limit;
    c.z = p.z + nz * limit;
    const outward = Math.max(0, (Math.cos(c.angle) * nx + Math.sin(c.angle) * nz) * (c.speed < 0 ? -1 : 1));
    c.speed *= Math.max(0, 1 - outward * outward);
    return true;
  }
  step(action: number) {
    if (!Number.isInteger(action) || action < 0 || action >= 9)
      throw new Error("Driving action must be an integer in [0,8]");
    const steer = (action % 3) - 1,
      throttle = Math.floor(action / 3) - 1,
      c = this.car,
      dt = DRIVING_CONTRACT.dt;
    const offRoad =
      this.track.nearest(c.x, c.z).distance > this.track.width / 2;
    c.steering += (steer - c.steering) * Math.min(1, dt * 9);
    const acceleration = throttle === 1 ? 9 : throttle === -1 ? -20 : 0;
    c.speed = Math.max(
      0,
      Math.min(
        DRIVING_CONTRACT.maxSpeed,
        c.speed +
          (acceleration -
            0.7 -
            c.speed * 0.045 -
            (offRoad ? c.speed * 0.8 : 0)) *
            dt,
      ),
    );
    c.angle += c.steering * c.speed * 0.12 * dt;
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.z += Math.sin(c.angle) * c.speed * dt;
    const boundaryContact = this.constrainToTrack();
    this.ticks++;
    return boundaryContact;
  }
}
