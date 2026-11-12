# Target Chasing

Two local surfaces live in this package:

1. The existing Three.js / DQN playground (`src/index.html`).
2. A **PPO before/after** replay (`src/ppo.html`) whose reward curve and checkpoints come from files written by the training script. There are no hardcoded metrics.

This package does not reuse the `@ignitionai/viz` work from PRs #77/#78.

## Requirements

Node >= 20, from the repository root, `corepack pnpm`.

## PPO experiment (declared before training)

Frozen budget and seeds: [`ppo-experiment.json`](./ppo-experiment.json).

- Task: 1-D navigation on `[0, 1]`; action `1` = +0.15, action `0` = −0.15; success when position `> 0.7`.
- Seeds: **11, 29, 47**.
- Budget: **80 episodes / seed**, **25 steps max**, train after every episode.
- Success criterion (per seed): mean return of the last 20 episodes **>** mean of the first 20.
- Failures are kept. Do not edit JSONL after the run.

## Commands

From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @ignitionai/backend-tfjs build
# Node cannot import tsc ESM output (extensionless specifiers). Training is driven by Vitest instead:
RUN_PPO_TRAIN=1 corepack pnpm exec vitest run packages/backend-tfjs/test/ppo-train-budget.test.ts
RUN_PPO_EVAL=1 corepack pnpm exec vitest run packages/backend-tfjs/test/ppo-eval-checkpoint.test.ts
corepack pnpm --filter target-chasing build
corepack pnpm --filter target-chasing dev
# PPO page: http://localhost:3000/ppo.html
corepack pnpm --filter target-chasing preview --host 127.0.0.1 --port 4173
```

Vite (dev): `corepack pnpm --filter target-chasing dev` then open `/` (DQN 3D) or `/ppo.html` (PPO replay).

## Measured results (from `public/ppo/`, not hardcoded)

Declared before the run in `ppo-experiment.json`: seeds **11, 29, 47**; **80** episodes; **25** steps; criterion last-20 mean > first-20 mean.

Values below are copied from `public/ppo/seed-*/summary.json` after
`RUN_PPO_TRAIN=1 corepack pnpm exec vitest run packages/backend-tfjs/test/ppo-train-budget.test.ts` (see `evidence/ign-170/09-train-ppo-budget.txt`). Node v22.23.4.

| seed | first 20 mean | last 20 mean | criterion |
| --- | --- | --- | --- |
| 11 | 0.4425 | 0.85 | improved |
| 29 | -0.1800 | 0.8175 | improved |
| 47 | 0.1475 | 0.8550 | improved |

No seed failed the declared criterion on this budget. Process failures (Node ESM import of `dist/`, first Playwright import) are in `evidence/ign-170/`, not hidden. This is a 1-D toy task, not a performance claim.

New-process greedy action at `[0.2]` for seed 11: expected 1, loaded 1 (`public/ppo/seed-11/eval-new-process.json`).

## Provenance of the numbers

After training, files under `public/ppo/` are the only source of the demo curve:

| File | Meaning |
| --- | --- |
| `public/ppo/experiment.json` | Copy of the frozen budget |
| `public/ppo/manifest.json` | SHA, node version, which seeds improved |
| `public/ppo/seed-<n>/episodes.jsonl` | Raw per-episode returns (success and failure) |
| `public/ppo/seed-<n>/summary.json` | Means computed from that JSONL |
| `public/ppo/seed-<n>/untrained/` | Checkpoint saved before training |
| `public/ppo/seed-<n>/trained/` | Checkpoint saved after the declared budget |
| `public/ppo/seed-<n>/eval-new-process.json` | Load in a **new process**, greedy action compared to the training process |

The UI throws `PPO checkpoint/log absent: …` when `manifest.json` or a log is missing. It never fakes a successful load.

## Limits

- 80 short episodes on a 1-D toy task is not a benchmark. A seed that does not beat its first-20 mean is reported as a failure.
- Checkpoints store actor/critic weights, not Adam moments or the exact RNG lane of TensorFlow.js kernels.
- Greedy replay in the browser is discrete PPO only (the continuous 1-D control coverage is in `packages/backend-tfjs/test/ppo-continuous.test.ts`).
- WebGL may run on SwiftShader/CPU; that is a software renderer, not a performance claim.

## DQN 3D playground

The original live training canvas is unchanged: `corepack pnpm --filter target-chasing dev` → `http://localhost:3000/`.
