# Circuit Racing

Run `pnpm --filter demo-car-circuit dev` from the workspace root, then open the displayed local URL. Run tests from the root with `pnpm exec vitest run packages/demo-car-circuit/test` (the Vite root is `src`).

The first racing slice provides two imported Kenney Car Kit vehicles (CC0), Alpine Park, a following camera and deterministic arcade driving at 60 simulation ticks per second. Accelerate with arrows/WASD/ZQSD, brake with Down/S, steer with Left/Right or A/Q/D. Escape, losing focus and changing vehicle pause the session. Both vehicles share identical physics.

Asset license and provenance are in `src/public/models/`. The versioned nine-action driving contract is in `src/racing/driving.ts`. The legacy constant-speed environment and its evaluation tests remain available; its checkpoints are not compatible with the racing contract.

Course mode adds a three-second countdown, three laps through 20 ordered checkpoints, standings and results. Up to four cars use a shared decision batch and physics clock. Ordered gates reject skipped checkpoints; brief cuts between gates are penalized rather than physically forbidden. Off-road excursions cost two seconds; a five-second off-road timeout rescues the vehicle to its last validated checkpoint and adds five seconds. Car contacts separate their collision bodies and reduce speed. A race stops at five simulated minutes or when all drivers finish. Equal times are ordered by stable driver ID.

The observation mode explicitly uses four **rule-based reference controllers**, not learned policies. The Train mode now creates a real imitation MLP, aggregates trajectories on Alpine Park, and switches from solo to frozen reference traffic after eight rounds. A new run uses 16 rounds of 4,096 examples and three Adam epochs per round (learning rate 0.003, batch size 128, two 32-unit tanh layers, nine-way softmax). The seed fixes initialization and sampling; the 20-element observation contains driving state, track anticipation and up to three opponents.

Stop completes the current gradient update then stops collection. Resume uses the loaded driver's seed and weights; loading recreates the optimizer, so this is a weights resume rather than an exact optimizer-state continuation. New driver discards the current unsaved network. Save stores real weights, contracts and reports in this browser's local garage. Reload refuses incompatible contracts or malformed weights.

Evaluation reconstructs a separate frozen network and checks both circuits, solo and with three rule-based traffic vehicles, using scenario seeds 101/307/509. Success means three laps, no rescue and no more than ten penalty seconds. Results remain attached to the evaluated weights; resumed training clears old reports.

`src/public/drivers/` contains all three scheduled training seeds and their complete reports, including failures. Aggregate measured success is 29/36; no checkpoint was selected by test-track performance. These imitation drivers are imperfect and often make contact in traffic. Run `pnpm dlx tsx scripts/train-racing.mts` at the root to reproduce native training/evaluation (requires the installed TFJS Node addon).

Player-versus-trained-driver inference and races between saved learned drivers are the next slices.

The frozen racing evaluation protocol names Alpine Park for training, Harbour for held-out testing, and seeds 101/307/509 before learned checkpoint selection. The original constant-speed evaluation has its separate version.

