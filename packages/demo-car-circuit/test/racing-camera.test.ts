import { expect, test } from "vitest";
import { RacingCamera } from "../src/racing/camera";

test("a sudden steering reversal cannot whip the viewing direction around", () => {
  const camera = new RacingCamera();
  camera.update({ x: 0, z: 0, angle: 0 }, 1 / 60);
  const before = camera.heading;
  camera.update({ x: 0, z: 0, angle: Math.PI / 2 }, 1 / 60);
  expect(Math.abs(camera.heading - before)).toBeLessThan(0.025);
});

test("pause freezes the camera and switching cars initializes without a flyover", () => {
  const rig = new RacingCamera();
  rig.update({x: 0, z: 0, angle: 0}, 1 / 60);
  const before = rig.position.clone();
  rig.update({x: 2, z: 0, angle: 1}, 0);
  expect(rig.position).toEqual(before);
  rig.update({x: 10, z: 10, angle: 0}, 0, true);
  expect(rig.position.x).toBe(-2);
  expect(rig.position.z).toBe(10);
});

test("the same turn has the same camera heading at 30 and 120 fps", () => {
  const a = new RacingCamera(), b = new RacingCamera();
  for (const rig of [a,b]) rig.update({x:0,z:0,angle:0}, 0);
  for (let i=0;i<30;i++) a.update({x:0,z:0,angle:0.4}, 1/30);
  for (let i=0;i<120;i++) b.update({x:0,z:0,angle:0.4}, 1/120);
  expect(a.heading).toBeCloseTo(b.heading, 5);
});
