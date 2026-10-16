# Ball Thrust — final integration verification: PASS

Executed final source: **d83a6646370bd3e983e910e415100ab4a887a871**, branch `feat/69-ball-thrust-integration`, assigned worktree `/Users/salimlaimeche/dev/ignition-demo-70-ball-thrust`. This evidence-only commit is necessarily later than the executed source. `environment.txt` records the untouched tracked source plus untracked evidence artifacts.

## Sources and evidence chain

- Protocol was committed before execution at **c95c98fcabd30b5e1e39df02601ae96a281d933a**; copied as `PROTOCOL.md`.
- The single measured4096-transition DQN experiment ran at **7a938309d49af3722e8e5ae9f3a2cd57265109da**. See [raw training results, weights and captures](../7a938309d49af3722e8e5ae9f3a2cd57265109da/README.md).
- The **only tree difference** from that measured source to this final source is three lines in the keyboard harness: keep its30s performance trajectory away from the terminal goal. `source-equivalence.txt` proves no app, physics, network, configuration or web source changed. Consequently the unaffected network experiment was not rerun or selected for a better result. The affected keyboard measurement and final root checks were rerun here.
- The #68 package at local branch tip **6ab871b** is byte-for-byte identical to `packages/demo-ball-thrust/` in this tested descendant; #69 adds the catalogue/articles/evidence only. Branches were locally stacked/replayed without merge or push; pre-review/pre-verification refs preserve the prior tips.

## Acceptance criteria

| Criterion | Result | Current evidence |
| --- | --- | --- |
| Real Rapier dynamics, collisions, no-op, seeded reset; no render-owned stepping | PASS |87 demo tests in root suite;10 headed keyboard checks |
|21 finite bounded observations,9 actions, dense reward, distinct terminal/truncation | PASS |Real WASM contract tests and documented source |
|Actual TF.js training changes weights/counters | PASS |4096 transitions,4065 updates,1806/2057 parameters changed; full raw bytes at measured source |
|Frozen initial/final/random held-out evaluation | PASS |Eight seeds1000–1007 per policy; raw episode results retained; no convergence promise |
|Strong pause/resume/mode/new-episode serialization | PASS |Deferred-real-fit integration test plus browser pause snapshot stability |
|Real local save → page reload → load → same-network inference without updates | PASS |Exact8228-byte equality, unchanged4065 updates after32+292 inference transitions; also FR/EN embedded runs |
|Bounded budget, checkpoint validation/errors and resource cleanup | PASS |Deadline red/green, actual artifact roundtrip, quota/malformed-data tests;28 tensors training,16 loaded/inference,0 after test disposal |
|Ninth catalogue demo serves the built app | PASS |FR/EN DOM discovers9 routes; build-demos copies actual DQN bundle |
|Catalogue → manual → train → save/reload/load → infer → back, FR/EN | PASS |`site-browser-r2/site-browser.json`,104/112 real training transitions and5 frozen inference actions per locale |
|Blog tables render semantically and narrow layouts do not overflow | PASS |Root MDX compilation tests plus actual FR/EN DOM:6 body rows/12 cells;390px checks |
|Actual30s render measurements and WebGL fallback | PASS |`physics-browser/browser-metrics.json` and prior loaded-network inference run; zero console/page errors |
|Final-source root tests/typecheck/build | PASS |`pnpm-test.log`, `typecheck.log`, `root-status.txt` |

These PASS labels establish functionality and the declared experiment, **not robust convergence or publication**.

## Measured outcomes and limits

Training source7a93830: **11665ms training /13778ms training+evaluation**,4096 transitions,4065 updates. Training seed70:51 successes in54 completed episodes. Held-out: initial0/8, final2/8, random1/8; mean returns10.75817 /52.44536 /17.56378. Six final episodes still time out; the split is tiny and indicates limited generalization, not a statistical guarantee.

Headed Chrome155.0.8059.41, AppleM4/ANGLE Metal, DPR1, TF.js CPU:

- Final-source manual moving run: **901 frames/30017.3ms,30.0160FPS RAF, p95 34.8ms**,29.1 simulated seconds. The physical timestep is still1/60s, independent of rendering cadence.
- Measured-source loaded-network inference: **901 frames/30023.1ms,30.0102FPS, p95 34.7ms**,292 actions/29.2 simulated seconds, exact unchanged weights.
- These are local desktop RAF measurements, not GPU timings, mobile claims or the120FPS historical physics-slice measurement.
- Checkpoint restores network/epsilon/counters, **not replay, optimizer slots, RNG position or an exact process resume**. The inherited DQN epsilon floor slightly undershoots.05 (actual.04996170339735633); protected backend code is unchanged.

## Root results, warnings and preserved failures

`pnpm test` at this final source: recursive builds exit0, **505 passed /3 skipped** across63 passed files and3 skipped files. `pnpm run typecheck`: exit0. The three HuggingFace tests require absent HF_TOKEN; no token or secret-backed service was used. The build prints the same **four pre-existing Nextra locale destructuring diagnostics**, documented before this feature, despite exit0. Both browser passes have **zero console/page errors**. Rapier's existing initialization deprecation warning is retained.

1. Original full keyboard run at7a93830 failed because its performance route successfully reached the target at6.6s. Its raw failure/captures remain in the prior evidence folder. The west-lane correction preserves all assertions and separate goal/eight-direction/collision checks; **R3 Standards/Spec both PASS**, then the complete final-source keyboard harness passed, including denied-WebGL fallback.
2. `site-browser/` and `site-browser.log` preserve the first integration-harness failure: an over-strict URL string assertion expected a trailing slash. The app itself loaded, with zero errors. `route-redirect.txt` authoritatively shows Next's normal **308 → `/demos/ball-thrust` →200**. The artifact harness now compares the canonical pathname; `site-browser-r2/` passes both locales, including actual game/training/persistence/inference/return behavior. No application source was altered to hide this failure.

## Reproduce

After the root build, the standalone demo preview serves port4170 and the web production server port3071. Exact server script is `pnpm --filter web start --hostname 127.0.0.1 --port 3071`. Use `localhost` as the web browser origin; the existing proxy has mixed-origin behavior when browsing via127.0.0.1.

```sh
pnpm test
pnpm run typecheck
PLAYWRIGHT_PATH=/Users/salimlaimeche/.npm/_npx/9833c18b2d85bc59/node_modules/playwright \
CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
BALL_THRUST_URL=http://127.0.0.1:4170 \
node packages/demo-ball-thrust/test/browser-check.cjs evidence/<executed-sha>/physics-browser
PLAYWRIGHT_PATH=/Users/salimlaimeche/.npm/_npx/9833c18b2d85bc59/node_modules/playwright \
CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
BLOG_URL=http://localhost:3071 \
node evidence/d83a6646370bd3e983e910e415100ab4a887a871/site-browser.cjs evidence/<executed-sha>/site-browser
```

The full training command is preserved at its executed SHA. Review artifacts, raw stdout/statuses, redirect read-back, checkpoint bytes and all screenshots remain in evidence. No push, merge, deployment, GitHub mutation or ticket closure occurred. The owner publishes the stacked PRs and merges/closes #68/#69 after review.
