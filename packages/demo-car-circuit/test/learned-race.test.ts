import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
