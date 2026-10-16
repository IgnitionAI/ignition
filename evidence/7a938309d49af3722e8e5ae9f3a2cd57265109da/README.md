# Ball Thrust — measured DQN experiment

Executed source: **7a938309d49af3722e8e5ae9f3a2cd57265109da**, local branch `feat/69-ball-thrust-integration`, 2026-10-15. No tracked source changes during execution. Environment and raw outputs are retained here; the later evidence-only commit is not the executed source.

## Protocol and separation of runs

`PROTOCOL.md` was frozen at **c95c98fcabd30b5e1e39df02601ae96a281d933a before execution**. One measured full run: environment seed70, DQN seed68, 4096 training transitions maximum, common training/evaluation wall ceiling300000ms; episode horizon300 actions, six1/60s Rapier steps/action. Eight held-out seeds1000–1007, initial/current greedy policies and uniform random seeded2026. No hyperparameter search, hidden retries or best-run selection.

Short unit/development/FR/EN workflow runs are qualification tests, not extra benchmark candidates. `development-smoke.log` corresponds to the standalone UI at source c96efff (108 transitions/77 updates, the article image), not this full experiment.

## Actual results

The headed Chrome155.0.8059.41 run on AppleM4/ANGLE Metal/DPR1 uses **TF.js CPU**. Training completed in **11665ms**, training plus evaluation in **13778ms**. 4096 transitions produced **4065 real optimizer updates**, 54 completed training episodes and51 successes on the repeated training seed. The same network is not robust on held-out spawns/targets:

| Policy | Mean return | Held-out successes |
| --- | ---: | ---: |
| Initial seeded network | 10.758170979169131 | 0/8 |
| Final greedy network | 52.44536218473647 | 2/8 |
| Uniform random | 17.563775020079852 | 1/8 |

Only eight evaluation episodes per policy: this is not statistical proof of superiority or convergence. Six final-network episodes still time out. No reward-only result is relabelled as reaching the target. Per-seed steps, returns, final distances and outcomes are in `training-browser/training-browser.json`.

## Weight and persistence proof

2057 parameters; **1806 changed**, L1 weight difference **407.029336712083**. Each checkpoint contains8228 actual network-weight bytes plus six weight specs and versioned metadata, read from TF.js's real IndexedDB `modelArtifacts`, not a UI-only counter.

- Initial SHA-256: `a706db6bcddcb85b825b3c916b7bb4793b2cee6369a6a0538d8c6ef12350e7e3`.
- Trained SHA-256: `001b313a27cae5b8dad807899c67c7dc6a106ed70ec597837d2341c13a6e9920`.
- Exact byte equality is asserted for trained → evaluated → page reload/load →32 inference actions →30 further inference seconds. Those five trained artifacts have that same SHA-256; update counter remains4065. All arrays are retained in `training-browser/weights-*.json`.
- TF tensors plateau at28 while training and16 after checkpoint load/inference. Three new-network/load/infer cycles remain16/16/16. Unit tests independently restore their baseline0 after dispose and check actual fit after loading an uncompiled artifact.
- The configured epsilon floor is.05; the existing protected DQN implementation stops at the slightly undershooting value **0.04996170339735633**, displayed as.0500. No backend change is included. Replay, optimizer slots and RNG position are not restored, as the UI explicitly says.

## Render measurement

Loaded-network inference: **901 RAF callbacks /30023.1ms =30.0102FPS**, p95 **34.7ms**, max35.3ms. **292 actual inference transitions /29.2 simulated seconds**, without a weight/update change. This is local headed-desktop RAF cadence, not GPU timing, physics frequency, a mobile benchmark or the historical120FPS result from slice1. The solver remains60Hz in simulation time.

## Checks and retained failures

- `pnpm-test.log`: recursive builds and **505 passed /3 skipped**,63 files passed. Missing HF_TOKEN skips only the three remote HuggingFace integration tests. No production token was used.
- `typecheck.log`: PASS.
- Standards/Spec R1 identified TSDoc, deadline, IndexedDB artifact and terminal-harness issues; R2 closes all findings. Reviewers were launched with `--no-extensions --no-skills --tools read`; this is a tool allowlist, not a claimed OS security sandbox.
- `deadline-red.log` retains the intentionally failing deadline regression; `review-green.log` retains87 passing demo tests after the fix.
- `physics-browser.log` retains a subsequent real failure: its four-direction30s route reached the goal at6.6 simulated seconds and correctly ended the manual episode. Assertions were NOT weakened. Only that route was changed to the west lane at source6ab871b; corrected final-source checks are in [the final integration evidence](../d83a6646370bd3e983e910e415100ab4a887a871/README.md). There was no second full training run.
- The build still prints four inherited Nextra locale destructuring diagnostics, with exit0, already documented in prior evidence94b621a. Current browser console/page errors: **zero**.

## Exact run command

```sh
PLAYWRIGHT_PATH=/Users/salimlaimeche/.npm/_npx/9833c18b2d85bc59/node_modules/playwright \
CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
BALL_THRUST_URL=http://127.0.0.1:4170 \
node packages/demo-ball-thrust/test/training-browser.cjs evidence/7a938309d49af3722e8e5ae9f3a2cd57265109da/training-browser
```

The harness drives real buttons and reloads the page; it does not write simulation state or use hidden application hooks. `environment.txt`, raw logs, checkpoint bytes and all captures are committed, including failures.
