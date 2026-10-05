# Continuous actions and SAC — issue #33 verification

Verified 2026-10-04. **PASS for the full issue's source implementation and local runtime acceptance.** This does not claim publication in npm 0.1.0 or deployment of the prototype. Plan: `docs/design/continuous-sac.md`; public API: `docs/design/continuous-api.md`.

## Five-seed learning result

The immutable `sac-point-mass-v1` protocol was committed before any learning. Each policy receives 20,000 interactions, TFJS CPU, fixed configuration and final scheduled checkpoint only. The original thresholds require at least four of five policies to succeed in >=70/100 held-out episodes, at least 50% overall mean cost reduction, and no runtime failures/incomplete budgets. No thresholds, seeds, task equations or checkpoint selection rules were changed.

| Training seed | Successes / 100 | Initial mean cost | Trained mean cost | Training seconds |
|---|---:|---:|---:|---:|
| 11 | 100 | 109.6876 | 6.8603 | 238.64 |
| 29 | 100 | 123.0550 | 6.4914 | 266.22 |
| 47 | 100 | 21.1448 | 7.2513 | 297.38 |
| 73 | 100 | 144.3803 | 7.1599 | 229.61 |
| 101 | 100 | 188.1535 | 6.7963 | 218.35 |

Overall: 500/500 trained episodes succeed; no runtime failure; every policy has exactly 20,000 samples and 9,751 updates. Mean cost decreases from 117.2842 to 6.9119, a 94.1067% reduction. This is a small controlled physical task, not evidence of performance on arbitrary continuous environments. All initial baseline episodes are retained, including baseline successes and failures.

Machine: Linux x64, AMD EPYC 9645 host, 8 logical CPUs exposed, 16,773,271,552 bytes memory; Node 20.19.2, TFJS 4.22.0 CPU JavaScript backend. Other work ran concurrently: timings are observed wall time, not an isolated hardware benchmark. Source commit `4b1db26aa632e0fdf0f9b4eed4ecb5bf5e33fd2d`; manifest pins ten source hashes, protocol hash and machine versions before initialization, training or evaluation.

`point-mass-v1/` preserves manifest, all five final checkpoints, all per-seed raw results and aggregate report. The separate auditor reloads the actual final checkpoints and re-creates initial policies. It reproduces **all 1,000 baseline/trained episodes exactly**, checks unchanged full policy snapshots during inference, validates source hashes against current files and the recorded git commit, verifies weights' hashes/counters, and independently recomputes statistics and original thresholds. `point-mass-v1/audit.json` and `audit-transcript.txt` retain that proof. Strict TypeScript and bundling of the auditor pass.

The first run received SIGTERM after three complete seeds and a partial fourth. `point-mass-v1-interrupted/` preserves its complete raw files and interruption record. It is incomplete, not a passing benchmark. The complete run was restarted from scratch for all five seeds in an independent process; no results were merged or seeds selected from the interrupted run.

## Acceptance evidence

| Requirement | Authoritative evidence | Result |
|---|---|---|
| Valid bounded vector API and copied ownership | Public continuous boundary checks, core-tests.json; SAC float32-bound validation | PASS |
| Serialized runner, episode signals, stop/reset and greedy inference | runner-tests.json; cursor-before.json reproduces optimizer-failure cursor regression | PASS |
| Genuine SAC training and fixed-policy evaluation | Five complete interaction budgets, checkpoint weights, raw episodes and independent replay audit | PASS |
| Twin critic targets, terminal/truncation bootstrap, squashed/scaled density, separate updates, Polyak interpolation | sac-focused-tests.json / sac-backend-tests.json; independent known-target loss and Gaussian quadrature cases | PASS |
| JSON checkpoint round-trip and atomic incompatibility rejection | Public backend checkpoint test; actual browser file import and rejection | PASS |
| Real continuous point-mass equations and episode boundaries | point-mass-tests.json; actual browser and 1,000 reproduced episodes | PASS |
| Runnable demo training, stop, persistence, inference and explicit errors | issue33-sac-demo-save/reload/trained-import/errors-infer/export.json and displayed screenshots | PASS |
| Predeclared five-seed budget/thresholds with raw outcomes/provenance | Original protocol commit, point-mass-v1 manifest/report/audit and interrupted-run archive | PASS |

## Core, mathematical and lifecycle checks

ContinuousRunner captures final observations before episode reset, preserves termination/truncation separately, validates actions before environment mutation and serializes work. Awaiting stop drains active work; queued automatic ticks are canceled. A rejected optimizer update cannot rewind the runner cursor: that regression failed before repair and passes now. The caller owns agent disposal. The complete current core suite has 82 PASS, and its build/strict new-test types pass.

The six SAC owner tests use real gradients and public snapshots. They establish changed actor/critic weights, Polyak interpolation, frozen weights/counters/RNG in greedy inference, stable tensor count and complete disposal. Constant target critics independently establish twin minimum and terminal/truncation loss (2 versus 8). Gaussian quadrature checks density correction for tanh and unequal per-dimension scales. JSON restoration preserves inference; malformed last-network weights and incompatible contracts are rejected before mutation.

The backend suite has 117 PASS and three explicitly skipped authenticated HF tests without credentials. The subsequently added point-mass tests plus SAC owner tests have eight PASS; task/test/harness TypeScript and backend build pass. HF storage is separate from this local SAC JSON format. All exact test reports are retained here; these tests alone are not the learning proof.

## Chromium demo proof

The local static demo at port 4191 uses the actual SACAgent and ContinuousRunner. Training reached 657 samples/79 updates before stop. Save, browser reload and load preserved counters; that short policy honestly achieved 0/20 quick-test successes. Importing the verified full-budget seed-11 checkpoint through the real file control preserved 20,000 samples/9,751 updates and produced 20/20 quick-test successes with a frozen checkpoint. An incompatible environment wrapper was rejected without changing the policy; a subsequent visual inference episode succeeded after 100 ticks.

Export JSON triggered a native Chromium download named sac-point-mass.json. Its 123,334-byte wrapper identifies point-mass-v1 and its checkpoint exactly equals the independently verified final seed-11 artifact. The CLI's QuickJS sandbox cannot retrieve download artifact paths. Recovery preserved the page and captured/displayed its current screenshot; native download behavior was configured through CLI CDP to the permitted tmp directory, then restored to default. The file was read from disk and compared independently. No policy, RNG, private model weights or app methods were injected.

CLI path-based file upload is also unsupported; verified file text was delivered as a browser File/DataTransfer to the existing file input change handler. All captured screenshots were displayed and visually inspected; retained copies are in screenshots/. App TypeScript and its browser bundle pass.

Checkpoints contain actor, both critics and targets, configuration/bounds, counters and RNG. Load recreates optimizers/replay and clears loss diagnostics. It is warm resume, not exact training continuation; compatible greedy outputs survive JSON round-trip. The documented public example passes strict compilation against the checked-in source.

## Reproduction

```sh
pnpm exec vitest run packages/core/test
pnpm exec vitest run packages/backend-tfjs/test
pnpm --filter @ignitionai/core build
pnpm --filter @ignitionai/backend-tfjs build
```

The runnable browser, full benchmark and independent auditor commands are in `packages/backend-tfjs/examples/continuous/README.md`. The benchmark refuses overwrite of an existing manifest. Review of the fixed source and artifact set: specification PASS; standards PASS; runtime acceptance PASS. Source PR remains draft; remote delivery gates must be reported separately from this local learning proof.
