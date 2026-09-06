# Local validation — 6 September 2026

Status: **acceptance remains open**. Parent-spec review found missing boundary collisions and rescue based on time off-road instead of prolonged immobilization. These rules are being corrected; existing learning and runtime results below describe the old race contract and must be renewed. A full human-driven race also remains unverified. No push, merge, deployment or issue closure is implied.

## Scope and evidence

| Scope | Evidence | Boundary |
| --- | --- | --- |
| #7 PPO public learning | Rollout/termination/truncation tests and public learning across seeds 11, 29, 47; native PPO convergence suite passes. | No live Hugging Face credentials were available. |
| #8 Frozen legacy Circuit evaluation | Distinct training/test tracks, controlled starts, explicit limits, versioned reports and public integration tests. | Legacy constant-speed checkpoints remain incompatible with Racing. |
| #10 Catalogue | One JSON catalogue drives eight routes, homepage counts and docs; all eight built with correct base paths. Production gallery and docs checked. | Target Chasing has not been accepted into this catalogue. |
| #13 3D driving | Two imported Kenney CC0 GLBs with texture, licence and source hashes; fixed 60 Hz physics, keyboard/focus/pause tests and browser rendering. Asset failure and Retry verified in production localhost. | Arcade desktop physics; local loading measurements are not internet latency promises. |
| #14 Race rules | Ordered gates, three laps, standings/ties, contacts, penalties/rescue and common decision clock tested. Four rule references completed a browser race; both tracks defined before training. | Brief cuts between gates are penalized; this is not realistic barrier physics. |
| #15 Real driver persistence | Browser imitation training → save → full reload → load → frozen evaluation; three scheduled checkpoints and all 36 reports retained, 29 successes. | Failures and frequent traffic contacts remain. Weights resume recreates optimizer. |
| #16 Learned races | Supplied imitation checkpoints 29 and 11 completed three browser laps in 105.45 s and 118.92 s. Frozen copies, checkpoint identifiers and unchanged weights tested. | No rule-controller fallback. Not proof of a human finish. |
| #11 Double DQN | Public analytic online/target test, API train/save/infer, exact same-seed weights, repeated-load memory test, Circuit selector and actual Q checkpoint reload into racing. V2 browser Double DQN seed 11 trained 20,000 transitions and scored 11/20 after save/full reload/load. Old Qv1 load produces an explicit incompatibility error. | Browser CPU and native TensorFlow are different numeric backends; native seed 11 scored 8/20. The browser Qv2 + imitation29 race ended at 300 s with both DNF. |
| #12 Equal-budget comparison | [V2 report](src/public/reports/racing-q-v2/index.html): five seeds × twenty full evaluations × two methods, 20,000 transitions and 4,993 updates each; same backend and protocol. Raw failures, weights, timings, versions and source hashes retained. Two independent reviews cross-checked these artifacts. | DQN 37/100 successes, 49 finishes; Double DQN 37/100, 56 finishes. No observed gain on aggregate success. V1 is explicitly archived as nonconforming. |
| #17 Player versus trained AI | Two vehicle choices, one to three actual trained opponents, shared physics/rules, HUD/map, pause/results; automated acceleration/braking/shared-clock/frozen-opponent tests and browser short-key acceleration/pause verified. | **A complete three-lap human keyboard race against a named learned checkpoint is still unverified.** |

## V2 experiment contract

`racing-q-learning-v2`: 10,000 solo decisions, then 10,000 with three frozen rule-reference traffic drivers. Six common physics ticks per Q decision in training, evaluation and races. Off-road errors preserve race rescue/penalty rules. Episodes truncate after 600 decisions or at the curriculum boundary; only finishing terminates them. The final scheduled weights are retained without evaluation-based selection.

Training seeds: 11, 29, 47, 73, 101. Evaluation seeds: 211, 307, 419, 509, 601 on Alpine Park and Harbour, solo and traffic. Success requires three laps, no rescue and at most ten penalty seconds. Scenarios vary the initial heading narrowly and are not independent broad driving scenarios.

V1 had early off-road termination and no training traffic. Its 68/100 versus 89/100 results are preserved for traceability but cannot support acceptance of the approved curriculum.

## Runtime measurements

Production localhost, Chromium 152 on macOS, 1280 × 720, four supplied imitation networks: 180 animation-frame intervals, median **8.3 ms**, p95 **10.3 ms**, mean **8.33 ms**. Warm local rendering; not a universal hardware guarantee. Vehicles: Formula R / Sport GT; Alpine Park; driving `circuit-racing-v1`, observations `racing-observation-v1`, race `circuit-race-v1`.

With browser cache disabled, local Formula GLB transfer took **5.1 ms** (26,667 compressed body bytes), finishing 154.8 ms after navigation; texture **1.9 ms**, finishing 163.7 ms. The source GLB is 167,272 bytes. Browser cache and request blocking were restored after checks. Blocking the GLB showed “Le véhicule n’a pas pu être chargé.” Restoring access and pressing Retry recovered the rendered vehicle.

## Commands and remaining manual check

- `npm test`: full workspace build, static demo build, Next build and **337 passing tests**, three credential-dependent integration skips.
- `pnpm run typecheck`: passed.
- `npm run lint`: exits successfully but explicitly skips ESLint because of existing configuration incompatibility. This is **not lint validation**.
- Final Circuit production rebuild covers the report link and DNF display polish after the full suite; these UI-only edits do not change training or physics.

To complete #17: open the locally served Circuit, choose Course → Play against AI, Sport GT and supplied imitation checkpoint 29, then finish all three laps. Record the checkpoint ID, result, penalties and whether replay/pause work. The available CUA key API emits short presses and has no key-hold operation. A direct CDP input attempt was rejected in favour of CUA; the human race has not been replaced with scripted AI driving.
