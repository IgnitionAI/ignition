# Circuit Racing

Run `pnpm --filter demo-car-circuit dev` from the workspace root, then open the displayed local URL. Run tests from the root with `pnpm exec vitest run packages/demo-car-circuit/test` (the Vite root is `src`).

The first racing slice provides two imported Kenney Car Kit vehicles (CC0), Alpine Park, a following camera and deterministic arcade driving at 60 simulation ticks per second. Accelerate with arrows/WASD/ZQSD, brake with Down/S, steer with Left/Right or A/Q/D. Escape, losing focus and changing vehicle pause the session. Both vehicles share identical physics.

Asset license and provenance are in `src/public/models/`. The versioned nine-action driving contract is in `src/racing/driving.ts`. The legacy constant-speed environment and its evaluation tests remain available; its checkpoints are not compatible with the racing contract.

Course mode adds a three-second countdown, three laps through 20 ordered checkpoints, standings and results. Up to four cars use a shared decision batch and physics clock. Ordered gates reject skipped checkpoints; brief cuts between gates are penalized rather than physically forbidden. Off-road excursions cost two seconds; a five-second off-road timeout rescues the vehicle to its last validated checkpoint and adds five seconds. Car contacts separate their collision bodies and reduce speed. A race stops at five simulated minutes or when all drivers finish. Equal times are ordered by stable driver ID.

The observation mode explicitly uses four **rule-based reference controllers**, not learned policies. The Train mode now creates a real imitation MLP, aggregates trajectories on Alpine Park, and switches from solo to frozen reference traffic after eight rounds. A new run uses 16 rounds of 4,096 examples and three Adam epochs per round (learning rate 0.003, batch size 128, two 32-unit tanh layers, nine-way softmax). The seed fixes initialization and sampling; the 20-element observation contains driving state, track anticipation and up to three opponents.

Stop completes the current gradient update then stops collection. Resume uses the loaded driver's seed and weights; loading recreates the optimizer, so this is a weights resume rather than an exact optimizer-state continuation. New driver discards the current unsaved network. Save stores real weights, contracts and reports in this browser's local garage. Reload refuses incompatible contracts or malformed weights.

Evaluation reconstructs a separate frozen network and checks both circuits, solo and with three rule-based traffic vehicles, using scenario seeds 101/307/509. Success means three laps, no rescue and no more than ten penalty seconds. Results remain attached to the evaluated weights; resumed training clears old reports.

`src/public/drivers/` contains all three scheduled training seeds and their complete reports, including failures. Aggregate measured success is 29/36; no checkpoint was selected by test-track performance. These imitation drivers are imperfect and often make contact in traffic. Run `pnpm dlx tsx scripts/train-racing.mts` at the root to reproduce native training/evaluation (requires the installed TFJS Node addon).

Course now opens a garage for two to four learned competitors. Select a local saved checkpoint or any of the three supplied trained networks, choose each vehicle independently, and start the AI race. The camera selector follows each driver's own speed, lap and penalty metrics. Results identify each checkpoint. Each race owns separately loaded frozen networks and disposes them on session changes. Missing bundled files are reported without hiding available local drivers; no rule-based substitute is used.

Browser proof: supplied checkpoints 29 and 11 both completed three laps, in 105.45 s and 118.92 s respectively. The public integration test verifies completion with unchanged weights. In the garage, choose Play against AI to drive with one to three learned opponents. Choose your vehicle independently; arrows/WASD/ZQSD use the same nine-action physics as the networks. Opening garage controls pauses the race. The HUD adds position, laps, penalties and a live map; the camera remains on the player.

Current player verification: shared-clock acceleration/braking and frozen-opponent tests pass; browser acceleration and Escape pause were observed. A browser run completing all three human laps remains unverified and is not claimed by the AI-only race proof.

The frozen racing evaluation protocol names Alpine Park for training, Harbour for held-out testing, and seeds 101/307/509 before learned checkpoint selection. The original constant-speed evaluation has its separate version.


## DQN and Double DQN on the racing contract

The method selector creates imitation, DQN or Double DQN drivers. Q-learning uses the same twenty observations, nine actions and arcade physics, with one decision every six ticks in training, evaluation and races. Q checkpoints use ReLU hidden layers and linear outputs; imitation retains tanh and softmax. The checkpoint algorithm and protocol identify the architecture and decision cadence, and all three methods can share a learned race.

`racing-q-learning-v2` fixes 20,000 training decisions, five training seeds, and twenty frozen full-race evaluations per checkpoint (five evaluation seeds × both tracks × solo/traffic). Training starts at varied positions on Alpine Park, uses10,000 solo decisions then10,000 with frozen reference traffic, preserves off-road recovery and uses progress rewards; evaluation uses the full standing-start race. Resume recreates optimizer, replay and exploration from the loaded weights, rather than restoring exact training state.

Native V2 results: DQN 37/100 successes (49 completed), Double DQN 37/100 (56 completed). Success rates across five training seeds ranged 0–85% and 15–45%; population standard deviations 28.0 and 11.2 percentage points. There is no gain on the complete success criterion at this budget. Raw failures, all final checkpoints, timing, versions and source hashes are in `src/public/reports/racing-q-v2/` and its rendered report. Native and browserCPU runs use different numeric backends and need not produce identical trained weights or scores.

V1 remains an explicit historical archive: it stopped recoverable off-road excursions and trained solo only, so its 68/100 vs 89/100 results do not validate the approved curriculum.

Reproduce with `pnpm exec tsx --tsconfig scripts/tsconfig.racing.json scripts/compare-racing-q.mts`, then `node scripts/report-racing-q.mjs`. The source aliases match the demo's Vite aliases; the repository's existing package ESM export points at an unbuilt file, so the runner does not rely on that package export. The runner refuses to overwrite an existing protocol file. Preserve or move the existing `.scratch/circuit-racing/q-comparison-v2` directory before a fresh run.

Browser CPU V2 verification: a newly trained Double DQN seed 11 checkpoint survived save → page reload → load and completed all twenty evaluations, with 11/20 successes. Old Qv1 checkpoints are explicitly rejected as incompatible. This checks the browser workflow independently of the native benchmark, where the same seed scored 8/20 on a different numeric backend.
