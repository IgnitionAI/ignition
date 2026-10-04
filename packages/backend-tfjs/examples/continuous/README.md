# Continuous SAC point-mass task

The task and thresholds were fixed in `docs/design/sac-point-mass-protocol-v1.json` before any learning run. `point-mass.ts` implements the exact physical equations, continuous acceleration bounds, termination/time limit and final-ten-tick success definition.

The caller initializes the TFJS CPU backend, creates `SACAgent` with input size 2 and the environment's actionSpace, then uses `ContinuousRunner.step()` to collect/train and `inferStep()` for greedy execution. The benchmark instead evaluates directly against a separate environment to retain complete final-episode metrics before reset. It checks that evaluation leaves the full checkpoint unchanged.

Run from the repository root after core/backend builds:

```sh
packages/backend-onnx/node_modules/.bin/esbuild packages/backend-tfjs/scripts/verify-sac-learning.ts --bundle --platform=node --format=cjs --alias:@ignitionai/core=./packages/core/src/index.ts --external:@tensorflow/tfjs-node --outfile=.scratch/verify-sac-learning.cjs
node .scratch/verify-sac-learning.cjs .scratch/sac-point-mass-v1
```

The script refuses to overwrite an existing manifest. It records versions, machine, commit and source hashes before training/evaluation, preserves each seed's final checkpoint and all baseline/trained episodes, and reports failure when the predeclared thresholds are not met. Optimizers and replay are not part of checkpoint resume. The task is a small controlled demonstration, not evidence of SAC performance on arbitrary continuous environments.
