import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { RaceWorld } from "../src/racing/race";
import { LearnedDriver } from "../src/racing/learned-driver";
import { observeDriver } from "../src/racing/observations";
import { LearnedRace, type RaceEntry } from "../src/racing/learned-race";
const entries: RaceEntry[] = [11, 29].map((seed) => ({
  id: `checkpoint-${seed}`,
  name: `Driver ${seed}`,
  model: "race",
  checkpoint: JSON.parse(
    readFileSync(
      new URL(`../src/public/drivers/driver-${seed}.json`, import.meta.url),
      "utf8",
    ),
  ),
}));
it("runs separately loaded learned policies to a result without changing their weights", () => {
  const session = new LearnedRace(entries);
  const before = session.snapshots().map((p) => p.weights);
  while (!session.race.finished) session.step();
  expect(session.race.drivers.every((d) => d.laps === 3)).toBe(true);
  expect(session.snapshots().map((p) => p.weights)).toEqual(before);
  expect(session.entries.map((e) => e.id)).toEqual([
    "checkpoint-11",
    "checkpoint-29",
  ]);
  session.dispose();
}, 30000);
it("rejects a missing or incompatible opponent instead of substituting reference rules", () => {
  expect(() => new LearnedRace([])).toThrow(/Select/);
  expect(
    () =>
      new LearnedRace([
        entries[0],
        {
          ...entries[1],
          checkpoint: { ...entries[1].checkpoint, driving: "old" },
        },
      ]),
  ).toThrow(/contract/);
});

it("applies human commands on the same clock while the saved opponent uses its own policy", () => {
  const session = new LearnedRace([entries[0]], true);
  const opponent = LearnedDriver.fromCheckpoint(entries[0].checkpoint);
  try {
    const before = session.snapshots().map((p) => p.weights);
    const canonical = new RaceWorld({ count: 2 });
    let opponentAction = 4;
    const advanceCanonical = (action: number) => {
      if (canonical.elapsedTicks % opponent.decisionInterval === 0) {
        opponentAction = opponent.action(observeDriver(canonical, 1));
      }
      canonical.step([action, opponentAction]);
    };
    let maximumSpeed = 0;
    for (let i = 0; i < 240; i++) {
      const action = i < 210 ? 7 : 8;
      session.step(action);
      advanceCanonical(action);
      maximumSpeed = Math.max(maximumSpeed, session.race.drivers[0].world.car.speed);
      expect(session.race.drivers[0].world.car).toEqual(canonical.drivers[0].world.car);
    }
    expect(maximumSpeed).toBeGreaterThan(5);
    expect(session.race.drivers[0].world.ticks).toBe(
      session.race.drivers[1].world.ticks,
    );
    const speed = session.race.drivers[0].world.car.speed;
    for (let i = 0; i < 20; i++) {
      session.step(1);
      advanceCanonical(1);
      expect(session.race.drivers[0].world.car).toEqual(canonical.drivers[0].world.car);
    }
    expect(session.race.drivers[0].world.car.speed).toBeLessThan(speed);
    expect(session.snapshots().map((p) => p.weights)).toEqual(before);
  } finally {
    opponent.dispose();
    session.dispose();
  }
});


it.each([false, true])('resolves vehicle contact in a learned race with human=%s without changing policy weights', human => {
  const session = new LearnedRace(human ? [entries[0]] : entries, human);
  try {
    const weights = session.snapshots().map(policy => policy.weights);
    while (session.race.countdown > 0) session.step();
    const [first, second] = session.race.drivers;
    second.world.car = { ...first.world.car };
    session.step(4);
    const separation = Math.hypot(first.world.car.x - second.world.car.x, first.world.car.z - second.world.car.z);
    expect(separation).toBeGreaterThan(1);
    expect(first.collisions).toBeGreaterThan(0);
    expect(second.collisions).toBeGreaterThan(0);
    expect(session.snapshots().map(policy => policy.weights)).toEqual(weights);
  } finally {
    session.dispose();
  }
});
