import { createRequire } from "node:module";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const require = createRequire(
  new URL("../packages/backend-tfjs/package.json", import.meta.url),
);
const tf = require("@tensorflow/tfjs-node");
import { LearnedDriver } from "../packages/demo-car-circuit/src/racing/learned-driver";
import {
  trainDriver,
  evaluateDriver,
} from "../packages/demo-car-circuit/src/racing/training";
import { LEARNING_PROTOCOL } from "../packages/demo-car-circuit/src/racing/learning-protocol";
const seeds = (process.env.RACING_SEEDS ?? "11,29,47").split(",").map(Number);
const rounds = Number(process.env.RACING_ROUNDS ?? 16);
const folder =
  process.env.RACING_OUTPUT ?? ".scratch/circuit-racing/learned-v2";
await mkdir(folder, { recursive: true });
const sourceFiles = ["driving", "race", "observations", "reference", "training", "learning-protocol", "learned-driver"].map(name => `packages/demo-car-circuit/src/racing/${name}.ts`);
const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, createHash("sha256").update(await readFile(path)).digest("hex")])));
await writeFile(`${folder}/protocol.json`, JSON.stringify({ protocol: LEARNING_PROTOCOL, seeds, rounds, sourceHashes, head: execFileSync("/usr/bin/git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim(), createdAt:new Date().toISOString(), node:process.version, tfjs:tf.version.tfjs, backend:tf.getBackend(), platform:process.platform, arch:process.arch }, null, 2), {flag:"wx"});
for (const seed of seeds) {
  const driver = new LearnedDriver(seed),
    start = Date.now();
  const untrained = await evaluateDriver(driver, { seed: 101 });
  await trainDriver(driver, {
    seed,
    rounds,
    onProgress: (p) =>
      console.log(
        JSON.stringify({ seed, ...p, seconds: (Date.now() - start) / 1000 }),
      ),
  });
  const checkpoint = driver.exportCheckpoint();
  await writeFile(`${folder}/driver-${seed}.json`, JSON.stringify(checkpoint));
  const frozen = LearnedDriver.fromCheckpoint(
    JSON.parse(JSON.stringify(checkpoint)),
  );
  const reports = [];
  for (const test of [false, true])
    for (const traffic of [false, true])
      for (const evaluationSeed of LEARNING_PROTOCOL.evaluationSeeds) {
        const report = await evaluateDriver(frozen, {
          seed: evaluationSeed,
          test,
          traffic,
        });
        reports.push(report);
        console.log(JSON.stringify({ trainingSeed: seed, ...report }));
      }
  await writeFile(
    `${folder}/report-${seed}.json`,
    JSON.stringify(
      {
        protocol: LEARNING_PROTOCOL,
        rounds,
        untrained,
        reports,
        seconds: (Date.now() - start) / 1000,
      },
      null,
      2,
    ),
  );
  frozen.dispose();
  driver.dispose();
}
