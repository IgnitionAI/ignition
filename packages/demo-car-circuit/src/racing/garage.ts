import {
  listDrivers,
  type SavedDriver,
  type DriverEvaluation,
} from "./training";
import type { DriverCheckpoint } from "./learned-driver";
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
    drivers.push(...listDrivers(storage));
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
    if (result.status === "fulfilled") drivers.push(result.value);
    else errors.push(String(result.reason));
  }
  return { drivers, errors };
}
