import { DrivingWorld } from "./driving";
/** Explicitly labelled rule-based reference; never presented as a learned driver. */
export function referenceAction(world: DrivingWorld): number {
  const c = world.car,
    near = world.track.nearest(c.x, c.z);
  const target = world.track.sample(
    near.progress + (3 + c.speed * 0.15) / world.track.length,
  );
  const error = Math.atan2(
    Math.sin(Math.atan2(target.z - c.z, target.x - c.x) - c.angle),
    Math.cos(Math.atan2(target.z - c.z, target.x - c.x) - c.angle),
  );
  const steer = Math.abs(error) < 0.06 ? 0 : Math.sign(error);
  const desired = Math.abs(error) > 0.5 ? 7 : Math.abs(error) > 0.2 ? 10 : 16;
  const throttle = c.speed > desired + 1 ? -1 : c.speed < desired ? 1 : 0;
  return (throttle + 1) * 3 + steer + 1;
}
