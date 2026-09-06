# Circuit Racing

Run `pnpm --filter demo-car-circuit dev` from the workspace root, then open the displayed local URL. Run tests from the root with `pnpm exec vitest run packages/demo-car-circuit/test` (the Vite root is `src`).

The first racing slice provides two imported Kenney Car Kit vehicles (CC0), Alpine Park, a following camera and deterministic arcade driving at 60 simulation ticks per second. Accelerate with arrows/WASD/ZQSD, brake with Down/S, steer with Left/Right or A/Q/D. Escape, losing focus and changing vehicle pause the session. Both vehicles share identical physics.

Asset license and provenance are in `src/public/models/`. The versioned nine-action driving contract is in `src/racing/driving.ts`. The legacy constant-speed environment and its evaluation tests remain available; its checkpoints are not compatible with the racing contract.

Training, race rules, saved drivers and player-versus-trained-driver inference are subsequent slices, not yet exposed by this first slice.
