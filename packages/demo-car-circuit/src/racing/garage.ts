import {
  listDrivers,
  type SavedDriver,
  type DriverEvaluation,
} from "./training";
import { LearnedDriver, type DriverCheckpoint } from "./learned-driver";

function acceptDriver(saved: SavedDriver, drivers: SavedDriver[], errors: string[]) {
  try {
    const loaded = LearnedDriver.fromCheckpoint(saved.checkpoint);
    loaded.dispose();
    drivers.push(saved);
  } catch (e) {
    errors.push(`${saved.id}: ${String(e)}`);
  }
}

export async function loadGarage({
  storage,
  base,
  fetcher = fetch,
}: {
  storage: Pick<Storage, "getItem">;
  base: string;
  fetcher?: (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
}) {
  const drivers: SavedDriver[] = [],
    errors: string[] = [];
  try {
    for (const saved of listDrivers(storage)) acceptDriver(saved, drivers, errors);
  } catch (e) {
    errors.push(String(e));
  }
  const bundled = await Promise.allSettled(
    [11, 29, 47].map(async (seed) => {
      const responses = await Promise.all(
        ["driver", "report"].map((prefix) =>
          fetcher(`${base}drivers/${prefix}-${seed}.json`),
        ),
      );
      if (responses.some((r) => !r.ok))
        throw new Error(`Checkpoint bundled-${seed}: asset unavailable`);
      const [checkpoint, report] = await Promise.all(
        responses.map((r) => r.json()),
      );
      if (!report || !Array.isArray((report as { reports: unknown }).reports))
        throw new Error(`Checkpoint bundled-${seed}: invalid report`);
      return {
        id: `bundled-${seed}`,
        name: `Imitation ${seed} · 48`,
        checkpoint: checkpoint as DriverCheckpoint,
        reports: (report as { reports: DriverEvaluation[] }).reports,
      };
    }),
  );
  for (const result of bundled) {
    if (result.status === "fulfilled")
      acceptDriver(result.value, drivers, errors);
    else errors.push(String(result.reason));
  }
  return { drivers, errors };
}
