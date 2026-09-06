# Local validation — 6 September 2026

Status: implementation and automated/local-browser checks delivered; **a full human-driven three-lap race against a named learned checkpoint remains unverified**. No push, merge, deployment or issue closure is implied.

## Scope and evidence

| Scope | Evidence | Boundary |
| --- | --- | --- |
| #7 PPO public learning | Rollout/termination/truncation tests and public learning across seeds 11, 29, 47; native PPO convergence suite passes. | Three live Hugging Face tests skip without credentials. |
| #8 Frozen legacy Circuit evaluation | Distinct training/test tracks, controlled starts, explicit limits, versioned reports and public integration tests. | Legacy constant-speed checkpoints remain incompatible with Racing. |
| #10 Catalogue | One JSON catalogue drives eight routes, homepage counts and docs; all eight built with correct base paths. Production gallery and docs checked. | Target Chasing has not been accepted into this catalogue. |
| #13 3D driving | Two imported Kenney CC0 GLBs with texture, licence and source hashes; common fixed 60 Hz physics, keyboard/focus/pause tests and browser rendering. Asset failure/Retry previously verified; final rails and assets rendered in production localhost. | Arcade desktop physics with circular collision bodies; local measurements are not internet latency promises. |
| #14 Race rules | Race V2: ordered gates, three laps, standings/ties, car contacts, continuous rail contacts, penalties, immobilization rescue and common decision clock. Combined car/rail constraints and finish/rescue ordering have regression tests. Four rule references finish in public simulation tests. | Off-road costs 2 s. Staying within 1 m for 5 s triggers rescue (+5 s); moving excursions remain recoverable. |
| #15 Real driver persistence | Fresh imitation V2 seeds 11, 29, 47: 33/36 successes, all checkpoints/reports retained. Pre-run protocol and source hashes match commit `020ba09`. Browser Q V3 training → save → full reload → load → frozen evaluation also completed. | Seed 11 fails the three held-out solo scenarios. Frequent traffic contacts remain. Weights resume recreates optimizer. |
| #16 Learned races | Fresh imitation V2 checkpoints 29 and 11 completed three browser laps in 103.27 s and 115.40 s, zero penalties/rescues. Separate frozen copies and unchanged weights tested. | No rule-controller fallback. This is not a human race proof. |
| #11 Double DQN | Public analytic online/target test, API train/save/infer, same-seed weights, repeated-load memory test, selector and Q checkpoint reload. Browser CPU Double DQN seed 11 trained 20,000 transitions and scored 15/20 after save/full reload/load. Old race-V1 checkpoints show an incompatibility error. | Browser CPU and native TensorFlow are different numeric backends. Mixed browser race completed: Q checkpoint `driver-11-1788718008363` in 222.15 s, imitation `bundled-29` in 240.77 s. |
| #12 Equal-budget comparison | [V3 report](src/public/reports/racing-q-v3/index.html): five seeds × twenty full evaluations × two methods, 20,000 transitions and 4,993 updates each. All failures, weights, timings, versions and source hashes retained; two independent reviews verified the artifacts. | DQN 42/100 successes, 61 finishes; Double DQN 33/100, 77 finishes. No gain on aggregate success. V1/V2 are historical archives. |
| #17 Player versus trained AI | Two vehicle choices, one to three trained opponents, common physics/rules, HUD/map, pause/results. Public acceleration/braking/shared-clock/frozen-opponent tests pass. Browser short-key acceleration/pause previously verified. | **A complete three-lap human keyboard race against a named learned checkpoint is still unverified.** |

## V3 experiment contract

`racing-q-learning-v3`, driving `circuit-racing-v2`, race `circuit-race-v2`: 10,000 solo decisions, then 10,000 with three frozen rule-reference traffic drivers. Six common physics ticks per Q decision in training, evaluation and races. Boundaries, collisions, immobilization rescue and off-road penalties are shared. Episodes truncate after 600 decisions or at the curriculum boundary; only finishing terminates them. Last scheduled weights are retained without evaluation-based selection.

Training seeds: 11, 29, 47, 73, 101. Evaluation seeds: 211, 307, 419, 509, 601 on Alpine Park and Harbour, solo and traffic. Success requires three laps, no rescue and at most ten penalty seconds. Evaluation seeds vary the initial heading narrowly; these are not independent broad driving scenarios.

DQN success across training seeds: 0–85%, population standard deviation 38.0 percentage points. Double DQN: 0–80%, 33.0 points. More Double DQN finishes do not imply more successes because penalties/rescues count. The result does not demonstrate general algorithm superiority.

V1 stopped recoverable off-road excursions and omitted training traffic. V2 corrected those two problems but used race V1 without boundary collision and rescued moving cars after five seconds off-road. Their raw data remains preserved; neither supports acceptance of the corrected rules.

Browser CPU V3: checkpoint `driver-11-1788717838571` was saved after training, restored after full page reload and evaluated on all twenty scenarios (15/20 success). Evaluated copy: `driver-11-1788718008363`. Browser and native training are distinct runs on different numeric backends. The evaluated browser Q checkpoint then completed three laps against imitation 29: 222.15 s versus 240.77 s; both arrivals and checkpoint IDs were visible in the results.

## Runtime measurements

Final production localhost, Apple M4 / 16 GiB, Chromium 152 on macOS, 1280 × 720, four fresh imitation networks (11, 29, 47, 11): 180 animation-frame intervals, median **8.3 ms**, p95 **9.5 ms**, mean **8.331 ms**. Active four-car traffic, approximately 44 s into the race. Warm local rendering; not a universal hardware guarantee. Formula R / Sport GT, Alpine Park, driving/race V2 and observations V1.

With browser cache disabled, final local Formula GLB transfer took **16.2 ms** (26,667 compressed body bytes), finishing 190.6 ms after navigation; texture **10.5 ms**, finishing 242.6 ms. Source GLB size: 167,272 bytes. Cache restored and Network instrumentation disabled afterward. Earlier asset-error validation blocked the GLB, observed “Le véhicule n’a pas pu être chargé.”, restored access and recovered via Retry; the loader/error boundary is unchanged by the rule correction.

Final rendered V3 report opened through the Training link. Report, raw JSON and all ten weight files returned HTTP 200; raw JSON contains all 200 evaluations. Narrow-window lap counter and readable result rows checked visually.

## Commands and remaining manual check

- `npm test`: full workspace build, static demo build, Next build and **343 passing tests**, three credential-dependent integration skips.
- `pnpm run typecheck`: passed.
- `npm run lint`: exits successfully but explicitly skips ESLint because of existing configuration incompatibility. This is **not lint validation**.
- All eight production demo HTML files reference their correct `/demos/<slug>/assets/` base.

To complete #17: open local Circuit, choose Course → Play against AI, Sport GT and supplied imitation V2 checkpoint 29, then finish all three laps. Record checkpoint ID, result, penalties and replay/pause behavior. The available CUA key API emits short presses and has no key-hold operation. Automatic approval review rejected direct CDP key input in favour of CUA. The required human race has not been substituted with scripted AI driving.

## Training UX follow-up

The reported difficulty was clarified as an unclear workflow, not a failed training computation. Reproduced the old interface: “Nouveau pilote” trained 16 sessions but returned to “Prêt”, without a clear next action or snapshot explanation. The revised guided flow was exercised in the browser: train → 9/12 evaluated → save → garage checkpoint `driver-11-1788719094256` → player mode with the same checkpoint still selected. Existing training algorithms and protocols are unchanged. Circuit TypeScript checking, 61 Circuit tests and production build passed; the new entry screen was visually checked on localhost3030. The test driver in that origin was saved before refreshing.

## Ghost-mode change requested by the maintainer

The maintainer explicitly requested no collisions between cars after observing a pile-up. Interactive AI/player/reference races now use `circuit-race-v2-ghost-v1`; this supersedes the earlier car-contact requirement for those races. Barriers, gates, off-road penalties and immobilization rescue remain active. Training/evaluation retain contact rules; the garage labels their recorded scores accordingly. Previous race results above describe the earlier contact mode, not ghost-mode performance. Regression tests verify overlapping cars follow exactly the solo trajectory without speed loss, barriers still constrain them, and both learned AI/human races enable ghosts. All 65 Circuit tests, Circuit TypeScript checking and the production build pass. The new ghost label and four-car start were checked in the final localhost3030 build.
