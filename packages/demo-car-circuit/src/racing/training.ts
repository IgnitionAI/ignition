import { RaceWorld } from "./race";
import { observeDriver } from "./observations";
import { referenceAction } from "./reference";
import { LearnedDriver, type DriverCheckpoint } from "./learned-driver";

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export interface TrainingProgress {
  round: number;
  loss: number | null;
  samples: number;
  traffic: boolean;
}
/** Dataset aggregation: one learner, labels from frozen rule references, no test track. */
export async function trainDriver(
  driver: LearnedDriver,
  options: {
    rounds: number;
    seed: number;
    signal?: AbortSignal;
    onWorld?: (world: RaceWorld) => void;
    onProgress?: (p: TrainingProgress) => void;
  },
) {
  const random = seededRandom(options.seed + driver.updates * 997);
  for (let round = 0; round < options.rounds; round++) {
    if (options.signal?.aborted) return;
    const traffic = driver.updates >= 24;
    const observations: number[][] = [],
      labels: number[] = [];
    let race = new RaceWorld({ count: traffic ? 4 : 1, countdown: 0 });
    // Diverse start states are training-only curriculum, with unchanged race physics.
    for (let sample = 0; sample < 4096; sample++) {
      if (sample % 256 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (options.signal?.aborted) return;
      }
      if (sample % 128 === 0) {
        race = new RaceWorld({ count: traffic ? 4 : 1, countdown: 0 });
        const d = race.drivers[0],
          p = race.track.sample(random());
        const side = (random() - 0.5) * 4;
        Object.assign(d.world.car, {
          x: p.x - Math.sin(p.angle) * side,
          z: p.z + Math.cos(p.angle) * side,
          angle: p.angle + (random() - 0.5) * 0.6,
          speed: random() * 24,
          steering: (random() - 0.5) * 2,
        });
        d.lastProgress = p.progress;
        d.gates = Math.floor(p.progress * 20);
        d.safeProgress = d.gates / 20;
      }
      const observation = observeDriver(race),
        label = referenceAction(race.drivers[0].world);
      observations.push(observation);
      labels.push(label);
      const useLearner = driver.updates > 0 && random() < 0.5;
      const actions = race.drivers.map((d, i) =>
        i === 0 && useLearner
          ? driver.action(observation)
          : referenceAction(d.world),
      );
      race.step(actions);
    }
    // Deterministic shuffle keeps sequential trajectories from biasing mini-batches.
    for (let i = observations.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [observations[i], observations[j]] = [observations[j], observations[i]];
      [labels[i], labels[j]] = [labels[j], labels[i]];
    }
    if (options.signal?.aborted) return;
    const loss = await driver.learn(observations, labels, 3);
    if (options.signal?.aborted) return;
    options.onWorld?.(race);
    options.onProgress?.({
      round: round + 1,
      loss,
      samples: driver.samples,
      traffic,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
export interface DriverEvaluation {
  seed: number;
  test: boolean;
  traffic: boolean;
  completed: boolean;
  success: boolean;
  laps: number;
  finishSeconds: number | null;
  penaltySeconds: number;
  rescues: number;
  contacts: number;
}
/** Receives a separately loaded network and never updates it. */
export async function evaluateDriver(
  driver: LearnedDriver,
  {
    seed,
    test = false,
    traffic = false,
    signal,
  }: { seed: number; test?: boolean; traffic?: boolean; signal?: AbortSignal },
): Promise<DriverEvaluation> {
  const race = new RaceWorld({ count: traffic ? 4 : 1, test, countdown: 0 });
  const random = seededRandom(seed),
    car = race.drivers[0].world.car;
  car.angle += (random() - 0.5) * 0.06;
  let steps = 0, action = 4;
  while (!race.finished && race.drivers[0].finishSeconds === null) {
    if (signal?.aborted) throw new Error("Evaluation cancelled");
    if (steps % driver.decisionInterval === 0) action = driver.action(observeDriver(race));
    race.step(
      race.drivers.map((d, i) => (i === 0 ? action : referenceAction(d.world))),
    );
    if (++steps % 240 === 0)
      await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const d = race.drivers[0],
    completed = d.finishSeconds !== null;
  return {
    seed,
    test,
    traffic,
    completed,
    success: completed && d.rescues === 0 && d.penaltySeconds <= 10,
    laps: d.laps,
    finishSeconds: d.finishSeconds,
    penaltySeconds: d.penaltySeconds,
    rescues: d.rescues,
    contacts: d.collisions,
  };
}
export interface SavedDriver {
  id: string;
  name: string;
  checkpoint: DriverCheckpoint;
  reports: DriverEvaluation[];
}
const STORE_KEY = "ignition-racing-drivers-v1";
export function listDrivers(
  storage: Pick<Storage, "getItem"> = localStorage,
): SavedDriver[] {
  const raw = storage.getItem(STORE_KEY);
  if (!raw) return [];
  const records: unknown = JSON.parse(raw);
  if (
    !Array.isArray(records) ||
    records.some(
      (r) =>
        !r ||
        typeof r.id !== "string" ||
        typeof r.name !== "string" ||
        !r.checkpoint ||
        !Array.isArray(r.reports),
    )
  )
    throw new Error("Invalid local driver garage");
  return records as SavedDriver[];
}
export function saveDriver(
  record: SavedDriver,
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
) {
  const records = listDrivers(storage).filter((d) => d.id !== record.id);
  // A single write preserves the previous garage if storage quota is exceeded.
  storage.setItem(STORE_KEY, JSON.stringify([...records, record]));
}
