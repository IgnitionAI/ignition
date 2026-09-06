import { RaceWorld } from "./race";
import { LearnedDriver, type DriverCheckpoint } from "./learned-driver";
import { observeDriver } from "./observations";

export interface RaceEntry {
  id: string;
  name: string;
  model: "race" | "sedan-sports";
  checkpoint: DriverCheckpoint;
}
/** Owns separately loaded, frozen copies; no reference controller or training path. */
export class LearnedRace {
  readonly race: RaceWorld;
  private readonly policies: LearnedDriver[] = [];
  constructor(
    readonly entries: readonly RaceEntry[],
    readonly human = false,
    test = false,
    readonly humanModel: RaceEntry["model"] = "race",
  ) {
    if (entries.length < (human ? 1 : 2) || entries.length > (human ? 3 : 4))
      throw new Error("Select 2–4 learned drivers, or 1–3 human opponents");
    this.race = new RaceWorld({
      count: entries.length + (human ? 1 : 0),
      test,
    });
    try {
      for (const entry of entries)
        this.policies.push(LearnedDriver.fromCheckpoint(entry.checkpoint));
    } catch (error) {
      this.dispose();
      throw error;
    }
  }
  get competitors() {
    const learned = this.entries.map(({ id, name, model }) => ({
      id,
      name,
      model,
    }));
    return this.human
      ? [{ id: "player", name: "Player", model: this.humanModel }, ...learned]
      : learned;
  }
  step(humanAction = 4) {
    if (this.race.finished) return;
    const observations = this.race.drivers.map((d) =>
      observeDriver(this.race, d.id),
    );
    const actions = this.race.drivers.map((_d, i) =>
      this.human && i === 0
        ? humanAction
        : this.policies[i - (this.human ? 1 : 0)].action(observations[i]),
    );
    this.race.step(actions);
  }
  snapshots() {
    return this.policies.map((p) => p.exportCheckpoint());
  }
  dispose() {
    for (const p of this.policies) p.dispose();
    this.policies.length = 0;
  }
}
