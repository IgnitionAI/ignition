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
  driver.dispose();
});
