# Ball Thrust 3D — Rapier + trainable DQN

Slices [#70](https://github.com/IgnitionAI/ignition/issues/70) (physics), [#68](https://github.com/IgnitionAI/ignition/issues/68) (RL) and [#69](https://github.com/IgnitionAI/ignition/issues/69) (integration). The frozen implementation/evaluation protocol is in [PLAN.md](PLAN.md), committed before execution at `c95c98f`.

## Run

From the repository root, using existing workspace dependencies:

```sh
pnpm --filter demo-ball-thrust dev
pnpm --filter demo-ball-thrust test
pnpm --filter demo-ball-thrust typecheck
pnpm --filter demo-ball-thrust build
pnpm --filter demo-ball-thrust preview --host 127.0.0.1 --port 4170
pnpm test
pnpm run typecheck
```

The initial mode is manual. Click the arena, then arrows/WASD/ZQSD apply impulses (eight directions); Space/release is no-op, not braking. Counter-thrust brakes. Losing focus/visibility clears keys. Orbit/zoom never affects actions. Narrow layouts are responsive, not a touch controller.

**Entraîner / reprendre** uses a real TF.js DQN; **Pause** waits for the in-flight update, **Inférence** uses the same network greedily without replay insertion or fitting. **Réinitialiser** creates a paused episode and preserves the network. Choose **Manuel**, **Entraîner** or **Inférence** afterwards. **Nouveau réseau** explicitly discards the current network and resets the per-network budget. An episode lasts at most 30 simulated seconds.

## Physics and ownership

`BallThrustEnv` is the **only physics clock**. Each action applies one normalized impulse, then six fixed 1/60 s Rapier steps. R3F copies the ball's translation/quaternion; rendering does not step or move physics. Manual, training, inference, tests and evaluation all reuse `populateWorld()` and the same environment. Faster training changes wall-clock speed, never the physics timestep.

The dynamic sphere is 1 kg, radius .35 m, with CCD and gravity −9.81 m/s². Floor, four walls and three obstacles are fixed cuboids shared with visible `SOLIDS`. Interior ±6 m; impulse .65 N·s; friction .65, restitution .55; linear/angular damping .25/.4. Solver settings: eight iterations, four CCD substeps and .12 m prediction distance. No kinematic movement, position clamping or hidden controller.

A uint32 seed (default 70) determines obstacle-free spawn/goal positions. Reset frees/recreates the whole world and settles it for 120 fixed ticks outside the episode counter. Same seed and action sequence reproduce the trajectory with this Rapier version, not necessarily across engines/versions. No network state is changed by an episode reset. The physical tests retain all eight directions × four seeds × 30 s containment checks (3 cm transient contact tolerance).

## TrainingEnv contract

Actions: **0 no-op, 1 N, 2 NE, 3 E, 4 SE, 5 S, 6 SW, 7 W, 8 NW**. N = −z, E = +x. Diagonals have equal impulse magnitude. Only integer indices are accepted.

| Observation indices | Value and normalization |
| --- | --- |
| 0–1 | Position x,z / 6 |
| 2–3 | Linear velocity x,z / 10 |
| 4–5 | Goal delta x,z / 12 |
| 6–7 | Height above sphere radius / 2; vertical velocity / 10 |
| 8–10 | Angular velocity x,y,z / 25 |
| 11–18 | Solid ray distances N,NE,E,SE,S,SW,W,NW / 4 m; sphere excluded |
| 19–20 | Goal position x,z / 6 |

All 21 observations are finite and clipped to [-1,1], rays to [0,1]. Clipping normalizes observations; it never clamps the physical state. Raw pose/velocity remain visible in the HUD. Rewards are `5 * (previousDistance - distance) - .01 - (action !== 0 ? .001 : 0)`, plus 15 for success or minus 15 for physical failure. Success means target distance ≤ .7 m near the floor. Physical failure means non-finite body state or x/z beyond ±6.1 m, y below −1 m or above 3 m. `terminated` means success/failure; `truncated` is the 300-action limit and cannot coincide with termination.

## Network and lifecycle

Existing `DQNAgent` + `IgnitionEnvTFJS.step()` / `.inferStep()` implement action selection, replay and Bellman updates. The demo scheduler only serializes and paces these public calls. Pause/mode changes/reset/save/load/dispose invalidate pending timers and await the active transition before touching the world/model.

Network: **21→32→32→9**, ReLU hidden layers, linear outputs, **2057 parameters**. TF.js CPU explicitly; seed 68, gamma .99, Adam .001, batch 32, replay 8192, target update every 100 updates, epsilon 1 decaying by .999 to .05. No loss is fabricated: the HUD reports real update counters, epsilon, weight fingerprint and episode returns. A higher return is not proof of successful navigation.

One network is capped at **4096 training transitions** across pause/resume/episode resets. Loading an older checkpoint cannot refund transitions already spent in the active session. **Évaluer les 3 politiques** uses independent worlds and held-out seeds 1000–1007: fresh seeded network, current greedy network, uniform random baseline (seed 2026). It cannot train or mutate the visible world. Raw per-episode results are expandable in the UI. The frozen protocol allows no convergence promises or post-result tuning.

## Local persistence

`IndexedDBProvider` saves `ball-thrust-dqn-v1` in this browser/origin. Versioned metadata records architecture, counters and DQN state. Loading validates metadata, actual tensor shapes and finite values before replacing the live network, and explicitly restores epsilon/update counters. Missing checkpoint, storage quota or incompatible data produce visible errors while preserving the active agent.

**Not an exact training-process resume:** replay, optimizer slots and RNG position are not persisted. Replay warms up again after loading; the optimizer is recompiled when necessary. Network weights and greedy predictions do survive reload. No token, external service or downloaded pretrained controller is used.

## Checks and evidence

Vitest discovers real Rapier/WASM contract/physics tests and real TF.js session tests. They check weight changes, exact inference freeze, serialized lifecycle, bounded budget, checkpoint round-trip and tensor cleanup.

Both opt-in browser harnesses use an existing headed Playwright/Chrome installation, not an added package:

```sh
PLAYWRIGHT_PATH=/absolute/path/to/playwright \
CHROMIUM_PATH=/absolute/path/to/chrome \
BALL_THRUST_URL=http://localhost:4170 \
node packages/demo-ball-thrust/test/browser-check.cjs evidence/$(git rev-parse HEAD)/physics-browser

# Frozen 4096-transition run, initial/final/random evaluation, real IndexedDB reload,
# byte-for-byte weight checks and a 30 s inference RAF sample:
PLAYWRIGHT_PATH=/absolute/path/to/playwright \
CHROMIUM_PATH=/absolute/path/to/chrome \
BALL_THRUST_URL=http://localhost:4170 \
node packages/demo-ball-thrust/test/training-browser.cjs evidence/$(git rev-parse HEAD)/training-browser
```

The keyboard harness drives actual events, never writes simulation state, and checks collisions, goal, resets, focus, narrow layout and denied-WebGL fallback. The training harness drives visible controls and reads actual IndexedDB artifacts, not hidden simulation hooks. RAF cadence is not GPU timing or a mobile-device guarantee. Final results belong to `evidence/<executed source SHA>/`; failures/skips remain documented. The evidence-only commit follows its executed source commit.
