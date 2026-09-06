import { expect, it } from "vitest";
import { RaceWorld } from "../src/racing/race";
import { observeDriver, OBSERVATION_SIZE } from "../src/racing/observations";
import { LearnedDriver } from "../src/racing/learned-driver";

it("uses the same finite observation schema with solo and traffic worlds", () => {
  for (const count of [1, 4]) {
    const race = new RaceWorld({ count });
    expect(observeDriver(race)).toHaveLength(OBSERVATION_SIZE);
    expect(observeDriver(race).every(Number.isFinite)).toBe(true);
  }
});
it("learns, serializes actual weights, and reloads identical frozen decisions", async () => {
  const driver = new LearnedDriver(11);
  const observation = observeDriver(new RaceWorld());
  const before = driver.exportCheckpoint();
  await driver.learn(
    Array.from({ length: 32 }, () => observation),
    Array(32).fill(7),
    15,
  );
  const saved = driver.exportCheckpoint();
  expect(saved.weights).not.toEqual(before.weights);
  const loaded = LearnedDriver.fromCheckpoint(
    JSON.parse(JSON.stringify(saved)),
  );
  expect(loaded.action(observation)).toBe(driver.action(observation));
  expect(loaded.exportCheckpoint().weights).toEqual(saved.weights);
  expect(saved.updates).toBeGreaterThan(0);
  driver.dispose();
  loaded.dispose();
});
it("rejects old contracts and malformed weight payloads before loading", () => {
  const driver = new LearnedDriver(11),
    saved = driver.exportCheckpoint();
  expect(() =>
    LearnedDriver.fromCheckpoint({ ...saved, driving: "constant-speed-v1" }),
  ).toThrow(/contract/i);
  expect(() => LearnedDriver.fromCheckpoint({ ...saved, weights: [] })).toThrow(
    /weights/i,
  );
  driver.dispose();
});

import { readFileSync } from "node:fs";
import {
  evaluateDriver,
  listDrivers,
  saveDriver,
} from "../src/racing/training";
it("completes a race using persisted learned weights without changing them", async () => {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL("../src/public/drivers/driver-11.json", import.meta.url),
      "utf8",
    ),
  );
  const driver = LearnedDriver.fromCheckpoint(checkpoint);
  const before = driver.exportCheckpoint().weights;
  const result = await evaluateDriver(driver, { seed: 101 });
  expect(result.laps).toBe(3);
  expect(result.completed).toBe(true);
  expect(driver.exportCheckpoint().weights).toEqual(before);
  driver.dispose();
}, 30000);
it("round-trips local driver metadata and preserves the garage on a quota failure", () => {
  let value: string | null = null;
  const storage = {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
  const driver = new LearnedDriver(11);
  const saved = {
    id: "my-driver",
    name: "My driver",
    checkpoint: driver.exportCheckpoint(),
    reports: [],
  };
  saveDriver(saved, storage);
  expect(listDrivers(storage)).toEqual([saved]);
  const before = value;
  expect(() =>
    saveDriver(
      { ...saved, id: "second" },
      {
        ...storage,
        setItem: () => {
          throw new Error("quota");
        },
      },
    ),
  ).toThrow("quota");
  expect(value).toBe(before);
  expect(() => listDrivers({ getItem: () => "[null]" })).toThrow(/garage/);
  driver.dispose();
});

import { vi } from "vitest";
import { trainDriver } from "../src/racing/training";
it("does not publish an obsolete training world when cancelled during the update", async () => {
  const driver = new LearnedDriver(11),
    controller = new AbortController();
  const onWorld = vi.fn(),
    onProgress = vi.fn();
  vi.spyOn(driver, "learn").mockImplementation(async () => {
    controller.abort();
    return 0;
  });
  await trainDriver(driver, {
    seed: 11,
    rounds: 1,
    signal: controller.signal,
    onWorld,
    onProgress,
  });
  expect(onWorld).not.toHaveBeenCalled();
  expect(onProgress).not.toHaveBeenCalled();
  driver.dispose();
});
it("rejects noninteger seeds before creating an unloadable checkpoint", () => {
  expect(() => new LearnedDriver(11.5)).toThrow(/Seed/);
});

import * as tf from '@tensorflow/tfjs';
it('keeps tensor usage stable across checkpoint exports and frozen inference',()=> {
  const driver=new LearnedDriver(11),observation=observeDriver(new RaceWorld());
  driver.action(observation);
  const before=tf.memory().numTensors;
  for(let i=0;i<50;i++) {driver.exportCheckpoint();driver.action(observation);}
  expect(tf.memory().numTensors).toBe(before);
  driver.dispose();
});

it('rejects archived race-V1 checkpoints after the boundary/recovery contract change', () => {
  const old = JSON.parse(readFileSync(new URL('../src/public/reports/imitation-v1/driver-11.json',import.meta.url),'utf8'));
  expect(() => LearnedDriver.fromCheckpoint(old)).toThrow(/contract/i);
});
