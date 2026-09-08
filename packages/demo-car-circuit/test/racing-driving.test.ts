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


it.each([-1, 1])('contains a car hitting boundary side %s and dissipates impact speed', side => {
  const world = new DrivingWorld(), p = world.track.sample(0.1);
  Object.assign(world.car, {x:p.x-Math.sin(p.angle)*5.5*side, z:p.z+Math.cos(p.angle)*5.5*side, angle:p.angle+side*Math.PI/2, speed:20});
  world.step(7);
  expect(world.track.nearest(world.car.x,world.car.z).distance).toBeLessThanOrEqual(5.576);
  expect(world.car.speed).toBeLessThan(2);
});

it('lets a human brake to a stop then reverse while agent braking stays unchanged', () => {
  const human = new DrivingWorld(), agent = new DrivingWorld();
  human.car.speed = agent.car.speed = 4;
  for (let i = 0; i < 120; i++) { human.step(1, true); agent.step(1); }
  expect(human.car.speed).toBeLessThan(-1);
  expect(human.car.speed).toBeGreaterThanOrEqual(-5);
  expect(agent.car.speed).toBe(0);
});

it('keeps rolling backward when reverse is released and reapplied', () => {
  const world = new DrivingWorld();
  world.car.speed = -4;
  world.step(4, true);
  world.step(1, true);
  expect(world.car.speed).toBeLessThan(-3.9);
});

it('softens a short human steering press at speed without changing agent control', () => {
  const human = new DrivingWorld(), agent = new DrivingWorld();
  human.car.speed = agent.car.speed = 25;
  const start = human.car.angle;
  for (let i=0;i<6;i++) { human.step(5, true); agent.step(5); }
  expect(Math.abs(human.car.angle-start)).toBeLessThan(0.03);
  expect(Math.abs(agent.car.angle-start)).toBeGreaterThan(0.07);
});
