import { describe, expect, it } from "vitest";
import { RaceWorld } from "../src/racing/race";

describe("shared racing rules", () => {
  it("holds every car for the countdown then advances a common tick", () => {
    const race = new RaceWorld({ count: 4 });
    const initial = race.drivers.map((d) => ({ ...d.world.car }));
    for (let i = 0; i < 180; i++) race.step([7, 7, 7, 7]);
    expect(race.drivers.map((d) => d.world.car)).toEqual(initial);
    race.step([7, 7, 7, 7]);
    expect(race.drivers.every((d) => d.world.ticks === 1)).toBe(true);
  });
  it("rejects an invalid batch before any car moves", () => {
    const race = new RaceWorld({ count: 2, countdown: 0 });
    expect(() => race.step([7, 9])).toThrow();
    expect(race.ticks).toBe(0);
    expect(race.drivers[0].world.ticks).toBe(0);
  });
  it("cannot count teleports or backwards start-line crossings as laps", () => {
    const race = new RaceWorld({ count: 1, countdown: 0 });
    const d = race.drivers[0];
    for (const progress of [0.3, 0.6, 0.9, 0.01, 0.99, 0.01]) {
      Object.assign(d.world.car, race.track.sample(progress));
      race.step([4]);
    }
    expect(d.laps).toBe(0);
  });
  it("separates colliding cars and rescues stranded cars with an explicit penalty", () => {
    const race = new RaceWorld({ count: 2, countdown: 0 });
    Object.assign(race.drivers[1].world.car, race.drivers[0].world.car);
    race.step([4, 4]);
    const [a, b] = race.drivers.map((d) => d.world.car);
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(2.39);
    a.x = 1000;
    for (let i = 0; i < 301; i++) race.step([4, 4]);
    expect(race.drivers[0].rescues).toBe(1);
    expect(race.drivers[0].penaltySeconds).toBe(7);
    expect(race.track.nearest(a.x, a.z).distance).toBeLessThan(1);
  });
});

import { referenceAction } from "../src/racing/reference";
it.each([false, true])(
  "completes three ordered laps on track test=%s with a labelled rule-based reference",
  (test) => {
    const race = new RaceWorld({ count: 1, countdown: 0, test });
    while (!race.finished)
      race.step(race.drivers.map((d) => referenceAction(d.world)));
    expect(race.drivers[0].laps).toBe(3);
    expect(race.drivers[0].finishSeconds).not.toBeNull();
    expect(race.standings[0].id).toBe(0);
  },
);

it("ranks simultaneous identical finishes deterministically and freezes completed results", () => {
  const race = new RaceWorld({ count: 2, countdown: 0 });
  for (const d of race.drivers) d.finishSeconds = 100;
  expect(race.standings.map((d) => d.id)).toEqual([0, 1]);
  race.step([7, 7]);
  expect(race.ticks).toBe(0);
});
it("runs four reference drivers on one common clock to completion", () => {
  const race = new RaceWorld({ count: 4, countdown: 0 });
  while (!race.finished)
    race.step(race.drivers.map((d) => referenceAction(d.world)));
  expect(race.drivers.every((d) => d.laps === 3)).toBe(true);
  expect(race.standings.map((d) => d.finishSeconds)).toEqual(
    race.standings.map((d) => d.finishSeconds).sort((a, b) => a! - b!),
  );
});

it("ranks the front grid ahead of the rear row across the start-line wrap", () => {
  const race = new RaceWorld({ count: 4 });
  expect(
    race.standings
      .slice(0, 2)
      .map((d) => d.id)
      .sort(),
  ).toEqual([0, 1]);
});


it('rescues prolonged immobilization on the road, but does not rescue a moving off-road car', () => {
  const stopped = new RaceWorld({countdown:0});
  for(let i=0;i<300;i++) stopped.step([4]);
  expect(stopped.drivers[0].rescues).toBe(1);
  expect(stopped.drivers[0].penaltySeconds).toBe(5);

  const moving = new RaceWorld({countdown:0}), d=moving.drivers[0];
  for(let i=0;i<360;i++) {
    const p=moving.track.sample(i/moving.track.length*0.08);
    Object.assign(d.world.car,{x:p.x-Math.sin(p.angle)*5,z:p.z+Math.cos(p.angle)*5,angle:p.angle,speed:0});
    moving.step([4]);
  }
  expect(d.rescues).toBe(0);
  expect(d.penaltySeconds).toBe(2);
});


it('freezes the finish before a same-tick immobilization rescue can alter the result', () => {
  const race=new RaceWorld({countdown:0}), d=race.drivers[0];
  const p=race.track.sample(1-0.000001);
  Object.assign(d.world.car,{x:p.x,z:p.z,angle:p.angle,speed:0.1});
  d.lastProgress=p.progress;d.gates=59;d.laps=2;d.stationaryTicks=299;
  d.motionAnchor={x:p.x,z:p.z};
  race.step([4]);
  expect(d.laps).toBe(3);
  expect(d.finishSeconds).not.toBeNull();
  expect(d.rescues).toBe(0);
  expect(d.penaltySeconds).toBe(0);
});


it('keeps colliding cars separated when one is pinned against a rail', () => {
  const race = new RaceWorld({count:2,countdown:0}), p=race.track.sample(0.1);
  race.drivers.forEach((d,i) => Object.assign(d.world.car,{x:p.x-Math.sin(p.angle)*(i?4:5.57),z:p.z+Math.cos(p.angle)*(i?4:5.57),angle:p.angle,speed:0}));
  race.step([4,4]);
  const [a,b]=race.drivers.map(d=>d.world.car);
  expect(Math.hypot(a.x-b.x,a.z-b.z)).toBeGreaterThanOrEqual(2.39);
  for(const d of race.drivers) expect(race.track.nearest(d.world.car.x,d.world.car.z).distance).toBeLessThanOrEqual(5.576);
  expect(race.drivers.map(d=>d.collisions)).toEqual([2,1]);
});


it('lets ghost cars overlap without pushing or slowing each other', () => {
  const race = new RaceWorld({count:2,countdown:0,ghost:true});
  const solo = new RaceWorld({countdown:0});
  for(const d of race.drivers) Object.assign(d.world.car,solo.drivers[0].world.car);
  for(let i=0;i<90;i++) {race.step([7,7]);solo.step([7]);}
  for(const d of race.drivers) {
    expect(d.world.car).toEqual(solo.drivers[0].world.car);
    expect(d.collisions).toBe(0);
  }
});
it('keeps rail collisions active in ghost races', () => {
  const race = new RaceWorld({countdown:0,ghost:true}), d=race.drivers[0], p=race.track.sample(.1);
  Object.assign(d.world.car,{x:p.x-Math.sin(p.angle)*5.5,z:p.z+Math.cos(p.angle)*5.5,angle:p.angle+Math.PI/2,speed:20});
  race.step([7]);
  expect(race.track.nearest(d.world.car.x,d.world.car.z).distance).toBeLessThanOrEqual(5.576);
  expect(d.world.car.speed).toBeLessThan(2);
  expect(d.collisions).toBe(1);
});

it('manual recovery keeps earned gates and applies the existing rescue penalty', () => {
  const race = new RaceWorld({count:1, countdown:0});
  const driver = race.drivers[0];
  driver.gates = 3;
  driver.safeProgress = 0.15;
  driver.world.car.speed = -4;
  race.rescue(0);
  expect(driver.gates).toBe(3);
  expect(driver.penaltySeconds).toBe(5);
  expect(driver.world.car.speed).toBe(0);
  expect(driver.world.track.nearest(driver.world.car.x,driver.world.car.z).distance).toBeLessThan(0.01);
});
