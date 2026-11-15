import { expect, it } from "vitest";
import { loadGarage } from "../src/racing/garage";
import { saveDriver } from "../src/racing/training";
import { LearnedDriver } from "../src/racing/learned-driver";
it("keeps a saved local driver available when bundled assets fail", async () => {
  let data: string | null = null;
  const storage = {
    getItem: () => data,
    setItem: (_key: string, value: string) => {
      data = value;
    },
  };
  const driver = new LearnedDriver(11);
  saveDriver(
    {
      id: "local-one",
      name: "Local one",
      checkpoint: driver.exportCheckpoint(),
      reports: [],
    },
    storage,
  );
  const garage = await loadGarage({
    storage,
    base: "/",
    fetcher: async () => ({ ok: false, json: async () => null }),
  });
  expect(garage.drivers.map((d) => d.id)).toEqual(["local-one"]);
  expect(garage.errors).toHaveLength(3);
  expect(garage.errors.every((e) => /asset unavailable/.test(e))).toBe(true);
  driver.dispose();
});

it("reports an incompatible bundled checkpoint instead of listing it", async () => {
  const garage = await loadGarage({
    storage: { getItem: () => null },
    base: "/",
    fetcher: async (url) => {
      if (url.includes("report-"))
        return { ok: true, json: async () => ({ reports: [] }) };
      return {
        ok: true,
        json: async () => ({
          format: "ignition-driver-v1",
          algorithm: "imitation-mlp",
          driving: "old-contract",
          observation: "racing-observation-v1",
          protocol: "racing-learning-v2",
          seed: 11,
          updates: 0,
          samples: 0,
          createdAt: "2020-01-01T00:00:00.000Z",
          weights: [],
        }),
      };
    },
  });
  expect(garage.drivers).toEqual([]);
  expect(garage.errors).toHaveLength(3);
  expect(garage.errors.every((e) => /contract/i.test(e))).toBe(true);
});
