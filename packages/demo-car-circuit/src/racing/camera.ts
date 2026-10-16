import { Vector3 } from "three";
import type { CarState } from "./driving";

/** Shared heading for position and aim: steering noise cannot swing the aim independently. */
export class RacingCamera {
  readonly position = new Vector3();
  readonly target = new Vector3();
  heading = 0;
  private ready = false;
  private x = 0;
  private z = 0;

  update(car: Pick<CarState, "x" | "z" | "angle">, delta: number, reset = false) {
    const dt = Math.max(0, Math.min(delta, 0.1));
    if (!this.ready || reset || Math.hypot(car.x - this.x, car.z - this.z) > 30) {
      this.x = car.x;
      this.z = car.z;
      this.heading = car.angle;
      this.ready = true;
    } else {
      const difference = Math.atan2(Math.sin(car.angle - this.heading), Math.cos(car.angle - this.heading));
      const rotation = difference * (1 - Math.exp(-dt * 2));
      this.heading += Math.max(-dt * 1.2, Math.min(dt * 1.2, rotation));
      const follow = 1 - Math.exp(-dt * 8);
      this.x += (car.x - this.x) * follow;
      this.z += (car.z - this.z) * follow;
    }
    const dx = Math.cos(this.heading), dz = Math.sin(this.heading);
    this.position.set(this.x - dx * 12, 7.5, this.z - dz * 12);
    this.target.set(this.x + dx * 5, 0.8, this.z + dz * 5);
  }
}
