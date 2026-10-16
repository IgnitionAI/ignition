# Ball Thrust — complete training delivery

## Analysis and scope

The manual physics slice is present, but no TrainingEnv, learner or inference exists. Existing issues #68 (RL/DQN) and #69 (web integration/evidence) cover the requested remaining work; no new issue is needed. Work stays in the assigned `ignition-demo-70-ball-thrust` worktree. Local stacked branches preserve one issue per branch: `feat/68-ball-thrust-dqn` starts at `aa135e20ea0cbb8574f72e6679ce038af226dfc7` (slice #70); the final integration branch for #69 will start from completed #68, without merging branches.

Reuse the public TrainingEnv, IgnitionEnvTFJS manual step/inferStep and DQNAgent, plus IndexedDBProvider. Protected packages are read-only. No push, merge, release, deployment or early ticket closure.

## Implementation decisions

1. **One physics owner.** BallThrustEnv owns one actual Rapier world. Each action applies one normalized impulse then advances six 1/60 s steps. R3F only copies poses. Remove automatic browser Physics stepping to prevent concurrent steps while TF.js awaits. Manual mode uses the same environment at 10 Hz. Reset recreates the entire world and deterministically settles the ball; no kinematic shortcut.
2. **RL contract.** Nine actions: no-op, N, NE, E, SE, S, SW, W, NW. Twenty-one bounded observations: x/z position divided by 6; x/z linear velocity divided by 10; goal dx/dz divided by 12; height above ball radius divided by 2 and vertical speed divided by 10; angular x/y/z velocity divided by 25; eight horizontal solid ray distances divided by 4; goal x/z divided by 6. Clip to [-1,1], rays to [0,1], document ordering and clipping. Goal radius 0.7 near floor. Reward = 5 × horizontal distance progress − 0.01 per transition − 0.001 for non-no-op, +15 on success, −15 on out-of-bounds failure. terminated means goal/failure; truncated means 300-action time limit, never both. Explicit seeded reset is reproducible; arrays/invalid actions are rejected.
3. **Actual learning.** Seeded TF.js CPU DQN, 21→32→32→9, batch 32, replay 8192, gamma .99, learning rate .001, epsilon 1→.05, decay .999, target update every 100 updates, seed 68. CPU is explicit and reproducible, not a fake GPU claim. Reuse runner.step/inferStep; the demo only schedules and awaits their promises. Do not reproduce Bellman updates or replay code.
4. **Serialized UI.** Manual, train, pause/resume, greedy inference, new episode, fresh network, save/load and evaluation. Stop scheduling and await in-flight transitions before changing modes, resetting, saving/loading or disposing. New episode preserves the network. Fresh network is explicit. Display architecture/parameter count, train and infer counters, epsilon, episode return/success, weight fingerprint/change and reward history. Failures visible as text; keyboard disabled outside manual mode.
5. **Persistence.** Reuse IndexedDBProvider with a versioned fixed model ID. Save network plus validated configuration/counters/agent state in metadata; restore those explicitly because DQN.load does not do so. Preserve exact inference weights/actions after reload. Do not claim replay or full optimizer-state resume; replay is not persisted. Quota/missing/incompatible checkpoint errors are visible without losing the active network.

## Frozen experiment protocol (before execution)

- Protocol version 1; training environment seed **70**, agent seed **68**.
- Maximum **4096 training transitions**, batch warmup included; no hidden retries, tuning or selecting the best run. User can run a smaller count but cannot silently exceed the cap for one network.
- Episode horizon **300 transitions = 30 simulated seconds**; six Rapier steps per action.
- Held-out evaluation seeds **1000,1001,1002,1003,1004,1005,1006,1007**, one complete episode each, max 300 transitions each.
- Compare the fresh seeded network, the final same network (greedy), and uniform random actions (seed **2026**) on that same split. Evaluation cannot train or mutate the main environment.
- Save raw per-episode returns, success/failure/truncation, steps and final distance. Report zero success or deterioration honestly; no convergence promise.
- Measure full weight-array difference before/after training; exact equality of weights and update counters before/after at least 32 inference transitions; checkpoint round-trip predictions/weights equal. Capture TF tensor counts after warmup and repeated lifecycle operations.
- Budget ceiling **5 minutes wall time** for the experiment; if reached, stop and retain the actual transition count and incomplete status. Never increase the budget based on results.

## Acceptance and verification

- Real WASM tests for bounded finite observations, all actions/no-op, dense progress reward, terminal versus time-limit semantics, seeded reset/trajectory, ray response, no wall tunneling and existing physical regressions.
- TF.js integration tests prove weight/update changes, inference freeze, serialized pause/reset/mode changes, budget enforcement and cleanup. Use local in-memory storage only in tests if IndexedDB is unavailable in Node; browser uses the real provider.
- Run pnpm test and relevant typechecks/builds at the final source SHA, preserving skips/failures. Existing Nextra locale diagnostics are tracked separately, not concealed.
- Headed browser walkthrough: catalogue FR/EN → demo → manual → train → pause/resume → save → reload → load → inference → back. Rapid command changes, missing checkpoint, narrow layout, denied WebGL and console checked.
- Render cadence/FPS and p95 over 30 s while running the actual training/inference UI; no mobile or GPU timing claims from desktop RAF.
- Update EN/FR articles and catalogue to describe actual training APIs and real measurements; preserve semantic GFM-table checks.
- evidence/<executed SHA>/ contains protocol, raw evaluations and weight proofs, exact source SHA/worktree state, commands/results and visible captures. Final oneshot verification reports PASS per acceptance criterion, or BLOCKED with retained evidence, never a fabricated convergence claim.

## Workflow gates

Analyze completed before this plan. Implement this plan, then independently review the full relevant changes, fix findings and repeat review, then verify runtime. #68 code is committed before #69 integration/documentation. The human publishes/merges the stacked branches; existing tickets remain open until integration.
