# Race HUD elapsed-time refresh — #43 / #17

The source change replaces six-frame publication with an elapsed-time cap of 10 Hz. Fixed simulation stepping, policy decisions, input and camera behavior remain unchanged.

## Review

Spec: PASS against docs/design/racing-hud-timing.md and #43. Standards: PASS; one local ref replaces the frame counter, no new API or test seam. No actionable findings.

## Runtime verification

Real Chromium page `issue17-hud-timing`, production preview http://127.0.0.1:4174/, title IgnitionAI — Car Circuit. The race was launched through the public garage with genuine bundled-11 and bundled-29 checkpoints; it was observed to completion without restarting.

- before.json: 2 visible updates / 11 animation frames / 4.3982 s.
- after.json: 7 visible updates / 8 animation frames / 4.4218 s during active racing.
- pause-resume.json: timer stable at 13.1 s while paused, camera 1 selected, timer advances to 13.6 s after resume.
- result.png: both learned policies complete 3/3 laps; bundled-29 103.27 s, bundled-11 115.40 s. Screenshot displayed and visually inspected.
- tests.txt: existing Circuit suite, 70 tests PASS.
- build.txt: production Vite build PASS, existing large-chunk warning retained.
- TypeScript: pnpm --filter demo-car-circuit exec tsc --noEmit, exit 0.

The before/after probes use public DOM mutations and animation frames, not private simulation state. Countdown frames were excluded from the accepted active-race probe. Software rendering and concurrent browser pages make these measurements unsuitable for a hardware FPS guarantee. Simulation seconds are distinct from wall time. Completed headed verification browsers were terminated after the paired probes; this is not evidence of a source-level FPS improvement.

All behavioral criteria PASS. PR inclusion and remote head are recorded on the issue after commit. This verifies the HUD repair only; a complete keyboard-player race required by #17 remains unproven.
