# Circuit Racing

Run `pnpm --filter demo-car-circuit dev` from the workspace root, then open the displayed local URL. Run tests from the root with `pnpm exec vitest run packages/demo-car-circuit/test` (the Vite root is `src`).

The first racing slice provides two imported Kenney Car Kit vehicles (CC0), Alpine Park, a following camera and deterministic arcade driving at 60 simulation ticks per second. Accelerate with arrows/WASD/ZQSD, brake with Down/S, steer with Left/Right or A/Q/D. Escape, losing focus and changing vehicle pause the session. Both vehicles share identical physics.

Asset license and provenance are in `src/public/models/`. The versioned nine-action driving contract is in `src/racing/driving.ts`. The legacy constant-speed environment and its evaluation tests remain available; its checkpoints are not compatible with the racing contract.

Course mode adds a three-second countdown, three laps through 20 ordered checkpoints, standings and results. Up to four cars use a shared decision batch and physics clock. Ordered gates reject skipped checkpoints; brief cuts between gates are penalized rather than physically forbidden. Off-road excursions cost two seconds; a five-second off-road timeout rescues the vehicle to its last validated checkpoint and adds five seconds. Car contacts separate their collision bodies and reduce speed. A race stops at five simulated minutes or when all drivers finish. Equal times are ordered by stable driver ID.

The observation mode explicitly uses four **rule-based reference controllers**, not learned policies. Training, saved learned drivers and player-versus-trained-driver inference remain subsequent slices.

The frozen racing evaluation protocol names Alpine Park for training, Harbour for held-out testing, and seeds 101/307/509 before learned checkpoint selection. The original constant-speed evaluation has its separate version.

