import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  LearnedRace,
  completeHumanRaceWithFrozenPolicy,
  type RaceEntry,
} from "../src/racing/learned-race";
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
  const before = session.snapshots().map((p) => p.weights);
  for (let i = 0; i < 240; i++) session.step(7);
  expect(session.race.drivers[0].world.car.speed).toBeGreaterThan(5);
  expect(session.race.drivers[0].world.ticks).toBe(
    session.race.drivers[1].world.ticks,
  );
  const speed = session.race.drivers[0].world.car.speed;
  for (let i = 0; i < 20; i++) session.step(1);
  expect(session.race.drivers[0].world.car.speed).toBeLessThan(speed);
  expect(session.snapshots().map((p) => p.weights)).toEqual(before);
  session.dispose();
});


it.each([false,true])('uses ghost mode for learned races, including human=%s', human => {
  const session=new LearnedRace(human ? [entries[0]] : entries,human);
  try {expect(session.race.ghost).toBe(true);} finally {session.dispose();}
});

it("finishes a human race against a frozen learned checkpoint without mutating weights", () => {
  const session = new LearnedRace([entries[1]], true, false, "sedan-sports");
  const before = session.snapshots().map((p) => p.weights);
  try {
    const result = completeHumanRaceWithFrozenPolicy(
      session,
      entries[0].checkpoint,
    );
    expect(session.race.drivers[1].laps).toBe(3);
    expect(session.race.drivers[1].finishSeconds).not.toBeNull();
    expect(result.competitorIds).toEqual(["player", "checkpoint-29"]);
    expect(result.rulesId).toBe("circuit-race-v2-ghost-v1");
    expect(result.driving).toBe("circuit-racing-v2");
    expect(session.snapshots().map((p) => p.weights)).toEqual(before);
  } finally {
    session.dispose();
  }
}, 60000);
