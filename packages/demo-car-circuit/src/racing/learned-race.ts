import { RaceWorld } from "./race";
import { LearnedDriver, type DriverCheckpoint } from "./learned-driver";
import { observeDriver } from "./observations";

export interface HumanRaceCompletion {
  finishSeconds: (number | null)[];
  laps: number[];
  competitorIds: string[];
  rulesId: string;
  driving: string;
}

export interface RaceEntry {
  id: string;
  name: string;
  model: "race" | "sedan-sports";
  checkpoint: DriverCheckpoint;
}
/** Owns separately loaded, frozen copies; no reference controller or training path. */
export class LearnedRace {
  readonly race: RaceWorld;
  private readonly previousActions: number[] = [];
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
      ghost: true,
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
        : (() => {
          const policy=this.policies[i-(this.human?1:0)];
          if(this.race.elapsedTicks % policy.decisionInterval===0 || this.previousActions[i]===undefined)
            this.previousActions[i]=policy.action(observations[i]);
          return this.previousActions[i];
        })(),
    );
    this.race.step(actions, this.human ? 0 : undefined);
  }
  snapshots() {
    return this.policies.map((p) => p.exportCheckpoint());
  }
  dispose() {
    for (const p of this.policies) p.dispose();
    this.policies.length = 0;
  }
}
/**
 * Finish a human session by driving the player slot with a frozen learned
 * checkpoint. Opponents keep the session policies. No rule controller.
 */
export function completeHumanRaceWithFrozenPolicy(
  session: LearnedRace,
  checkpoint: DriverCheckpoint,
): HumanRaceCompletion {
  if (!session.human)
    throw new Error("Frozen-policy completion is for human races");
  const player = LearnedDriver.fromCheckpoint(checkpoint);
  const before = session.snapshots().map((p) => p.weights);
  try {
    while (!session.race.finished)
      session.step(player.action(observeDriver(session.race, 0)));
    expectUnchangedWeights(before, session.snapshots().map((p) => p.weights));
    return {
      finishSeconds: session.race.drivers.map((d) => d.finishSeconds),
      laps: session.race.drivers.map((d) => d.laps),
      competitorIds: session.competitors.map((c) => c.id),
      rulesId: session.race.rulesId,
      driving: checkpoint.driving,
    };
  } finally {
    player.dispose();
  }
}
function expectUnchangedWeights(
  before: DriverCheckpoint["weights"][],
  after: DriverCheckpoint["weights"][],
) {
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("Learned opponent weights mutated during the race");
}
