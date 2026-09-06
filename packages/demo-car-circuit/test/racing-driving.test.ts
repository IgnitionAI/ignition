import { it, expect } from "vitest";
import { DrivingWorld, DRIVING_CONTRACT } from "../src/racing/driving";

it("accelerates, brakes and advances on the public fixed-step contract", () => {
  const world = new DrivingWorld();
  const start = { ...world.car };
  for (let i = 0; i < 60; i++) world.step(7);
  expect(world.car.speed).toBeGreaterThan(5);
  expect(
    Math.hypot(world.car.x - start.x, world.car.z - start.z),
  ).toBeGreaterThan(2);
  const speed = world.car.speed;
  for (let i = 0; i < 20; i++) world.step(1);
  expect(world.car.speed).toBeLessThan(speed);
  expect(DRIVING_CONTRACT.actionCount).toBe(9);
});
it("repeats the same trajectory with the same commands", () => {
  const a = new DrivingWorld(),
    b = new DrivingWorld();
  for (let i = 0; i < 100; i++) {
    a.step(i < 50 ? 7 : 8);
    b.step(i < 50 ? 7 : 8);
  }
  expect(a.car).toEqual(b.car);
  expect(() => a.step(42)).toThrow();
});

it('can recover from a stationary off-road position', () => {
  const world = new DrivingWorld();
  world.car.z -= 12;
  for (let i=0;i<60;i++) world.step(7);
  expect(world.car.speed).toBeGreaterThan(1);
});
