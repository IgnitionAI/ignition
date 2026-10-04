# Continuous SAC point-mass task

The task and thresholds were fixed in `docs/design/sac-point-mass-protocol-v1.json` before any learning run. `point-mass.ts` implements the exact physical equations, continuous acceleration bounds, termination/time limit and final-ten-tick success definition.

The caller initializes the TFJS CPU backend, creates `SACAgent` with input size 2 and the environment's actionSpace, then uses `ContinuousRunner.step()` to collect/train and `inferStep()` for greedy execution. The benchmark instead evaluates directly against a separate environment to retain complete final-episode metrics before reset. It checks that evaluation leaves the full checkpoint unchanged.

Run from the repository root after core/backend builds:

```sh
packages/backend-onnx/node_modules/.bin/esbuild packages/backend-tfjs/scripts/verify-sac-learning.ts --bundle --platform=node --format=cjs --alias:@ignitionai/core=./packages/core/src/index.ts --external:@tensorflow/tfjs-node --outfile=.scratch/verify-sac-learning.cjs
node .scratch/verify-sac-learning.cjs .scratch/sac-point-mass-v1
```

The script refuses to overwrite an existing manifest. It records versions, machine, commit and source hashes before training/evaluation, preserves each seed's final checkpoint and all baseline/trained episodes, and reports failure when the predeclared thresholds are not met. Optimizers and replay are not part of checkpoint resume. The task is a small controlled demonstration, not evidence of SAC performance on arbitrary continuous environments.

## Browser demo

Build the local static demo from the repository root:

```sh
mkdir -p .scratch/sac-demo
cp packages/backend-tfjs/examples/continuous/index.html .scratch/sac-demo/index.html
packages/backend-onnx/node_modules/.bin/esbuild packages/backend-tfjs/examples/continuous/app.ts --bundle --platform=browser --format=esm --alias:@ignitionai/core=./packages/core/src/index.ts --outfile=.scratch/sac-demo/app.js
python3 -m http.server 4191 --bind 127.0.0.1 --directory .scratch/sac-demo
```

Open http://127.0.0.1:4191/. Any equivalent static HTTP server may replace Python. Controls exercise actual training, stop, greedy episodes, a clearly labelled 20-episode quick evaluation, local JSON save/load and file import/export. Demo files wrap the snapshot as `{ environment: "point-mass-v1", checkpoint: ... }`; raw benchmark snapshots must be wrapped with that verified environment identity before importing. The quick test is not the 100-episode benchmark. Resume uses fresh optimizers/replay.

The public contracts, execution lifecycle and checkpoint limits are documented in [the continuous source API](../../../../docs/design/continuous-api.md).

## Recheck a completed benchmark

After the benchmark has written `report.json`, independently reload every final checkpoint and reproduce all baseline/trained evaluation episodes:

```sh
packages/backend-onnx/node_modules/.bin/esbuild packages/backend-tfjs/scripts/audit-sac-learning.ts --bundle --platform=node --format=cjs --alias:@ignitionai/core=./packages/core/src/index.ts --external:@tensorflow/tfjs-node --outfile=.scratch/audit-sac-learning.cjs
node .scratch/audit-sac-learning.cjs .scratch/sac-point-mass-v1
```

The auditor verifies raw checkpoint hashes, frozen protocol, recorded source hashes against both the current files and recorded git commit, exact samples/update budgets, all reproduced episode metrics, frozen policy state, and independently recomputed aggregate criteria. It refuses a missing/incomplete report. Its summary reports learning PASS only when the original protocol passes; successful artifact parsing alone cannot establish learning.
