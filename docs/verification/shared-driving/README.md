# Shared player and learned-driver physics

Verified 2026-10-04 for issues #9 and #17. The prior player-only branch changed steering, drag, braking and reverse while claiming the same v2 driving contract. The correction routes keyboard and AI actions through the canonical v2 equations already used for training/checkpoints. AI dynamics are unchanged; player hold-to-reverse and steering attenuation are removed. English/French help now says Brake/Freiner.

The extended existing LearnedRace API test compares player state after every countdown/movement/braking tick with the public canonical DrivingWorld using the same initial state and actions. It also retains frozen-opponent weights and shared-clock checks. Before correction, the assertion fails on the first active movement tick because player speed differs. The final test additionally exercises turning. Obsolete tests requiring identity-dependent physics were removed; the common brake-to-rest behavior is retained.

Validation:

```sh
corepack pnpm exec vitest run packages/demo-car-circuit/test/racing-driving.test.ts packages/demo-car-circuit/test/racing-race.test.ts packages/demo-car-circuit/test/learned-race.test.ts packages/demo-car-circuit/test/q-training.test.ts packages/demo-car-circuit/test/racing-learning.test.ts
corepack pnpm exec tsc --noEmit -p packages/demo-car-circuit/tsconfig.json
corepack pnpm --filter demo-car-circuit build
```

40 tests passed; TypeScript and production Vite build passed. The owner suite was rerun after adding assertion-failure cleanup (finally disposal) and passed. Build still emits existing Node built-in browser-externalization and large-chunk warnings.

Browser verification uses the newly built Vite production preview http://127.0.0.1:4174/, not the older Next preview. ArrowUp raised displayed speed to 015 km/h; ArrowDown returned it to 000; Escape displayed Session en pause. Keyboard help shows Freiner. No page errors were observed in the initial control capture. Final browser measurements explicitly wait for HUD updates. The captured screenshot was shown inline and inspected.

Review: PASS for the planned shared-physics correction and repository standards. This evidence does not prove a complete human race, rendering performance, all garage errors or all parent issue criteria. Issues #9/#17 remain open. Checkpoint race/evaluation protocol distinctions, including contact versus ghost mode, remain separate and unchanged by this fix.
