import { Vector3 } from 'three';
import type { XYZ } from '../simulation-contract';

/** Visual envelopes only. Actors use yaw-safe collider radii; dock contains the
 * actual adapted GLB (including its gantry), not the architectural hangar. */
export function cameraFrame(c: XYZ, d: XYZ, goal: XYZ, width: number, height: number, compact: boolean) {
  const aspect = Math.max(.3, width / Math.max(1, height));
  if (!compact) {
    // Preserve the accepted desktop equations, including their unnormalised offset.
    const target = new Vector3((Math.min(c.x, d.x, goal.x) + Math.max(c.x, d.x, goal.x)) / 2, 0, (c.z + d.z) / 4);
    const span = Math.max(10, Math.abs(goal.x - c.x) + 5);
    const distance = Math.max(19, span / aspect * 1.25);
    return { fov: 43, target, position: target.clone().add(new Vector3(-distance * .24, distance * .82, distance * .66)) };
  }
  const points: Vector3[] = [];
  function box(center: XYZ, min: number[], max: number[]) {
    for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) points.push(new Vector3(center.x + x, center.y + y, center.z + z));
  }
  const cargoRadius = Math.hypot(1, .8), droneRadius = Math.hypot(.8, .6);
  box(c, [-cargoRadius, -.6, -cargoRadius], [cargoRadius, .6, cargoRadius]);
  box(d, [-droneRadius, -.4, -droneRadius], [droneRadius, .4, droneRadius]);
  box(goal, [-4.51, -1, -5.01], [4.67, 5.21, 5.01]);
  const target = new Vector3((Math.min(c.x, d.x, goal.x) + Math.max(c.x, d.x, goal.x)) / 2, .3, (c.z + d.z) / 4);
  // Look along the route with a low target: allocate less image to the ceiling.
  const backward = new Vector3(-.85, .34, .4).normalize();
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), backward).normalize();
  const up = new Vector3().crossVectors(backward, right);
  const fov = 48, tanV = Math.tan(fov * Math.PI / 360), margin = .88;
  let distance = 0;
  for (const point of points) {
    const relative = point.sub(target), depth = relative.dot(backward);
    distance = Math.max(distance, depth + Math.abs(relative.dot(right)) / (tanV * aspect * margin), depth + Math.abs(relative.dot(up)) / (tanV * margin), depth + .2);
  }
  return { fov, target, position: target.clone().addScaledVector(backward, distance) };
}
