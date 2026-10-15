# Ball Thrust 3D — physical playground

Scope: [issue #70](https://github.com/IgnitionAI/ignition/issues/70), part 1/3. The issue is the specification at base `776dca6819d68d15b679c2338b327d6b78168222`; no separate Ball Thrust spec exists there. No agent, training loop or speculative RL interface in this slice.

## Run

From the repository root, with workspace dependencies installed:

```sh
pnpm --filter demo-ball-thrust dev
pnpm --filter demo-ball-thrust test
pnpm --filter demo-ball-thrust typecheck
pnpm --filter demo-ball-thrust build
pnpm --filter demo-ball-thrust preview --host 127.0.0.1 --port 4170
pnpm test
pnpm run typecheck
```

Select the arena by clicking it or tabbing to it. Arrows, WASD or ZQSD apply horizontal impulses; combine axes for eight directions. Up = −z and right = +x, independent of orbit orientation. Space overrides held directions with **no-op**; releasing keys also means no-op, **not braking**. Counter-thrust brakes. Losing focus or hiding the page clears held inputs. Drag to orbit, scroll to zoom. Keyboard play is the supported control mode; narrow layouts are responsive, not a touch controller.

## Physics and reset

- `physics.ts` populates the **same real Rapier world** in the R3F `<Physics>` provider and headless WASM tests. The provider alone steps the browser world; no second simulation or render-driven position integration.
- One dynamic 1 kg sphere, radius 0.35 m, gravity −9.81 m/s², CCD; fixed cuboid floor, four 2 m walls and three obstacles. Playable interior: x/z ∈ [−6, 6] m. All visible solid dimensions share `SOLIDS` with the colliders.
- 60 Hz fixed timestep, impulses of 0.65 N·s at 10 Hz while held; normalized diagonals. Friction 0.65, restitution 0.55, linear/angular damping 0.25/0.4. Solver tuning lives in `SOLVER`: 8 iterations, up to 4 CCD substeps, predictive contacts within a 12 cm sweep (one frame at arena thrust speeds). The sustained-thrust tests cover all eight directions for 30 seconds on seeds 0, 70, 71 and 4294967295, and allow 3 cm of transient contact-solver penetration, never position clamping.
- Only `applyImpulse` moves the player during play. The sphere mesh reads Rapier translation/quaternion each frame. HUD reads Rapier at 10 Hz: position, full velocity vector/norm, horizontal goal distance, simulated time. Goal success latches when the sphere center enters the 0.7 m target radius near floor height; physics continues afterwards.
- Seed: uint32 [0, 4294967295], default 70. A deterministic LCG selects spawn and goal inside obstacle-free corners. Reset remounts the **Physics provider**, recreating bodies, velocities, rotations, solver/contact caches and timer; the canvas and camera stay alive. Same seed + same fixed-step action sequence → same trajectory with this Rapier version. This is not a cross-engine/version bitwise guarantee.
- `@dimforge/rapier3d-compat` 0.15.0 is the version already resolved by `@react-three/rapier` 2.1.0, exposed directly for shared types and WASM tests. No new library/version introduced.

WebGL is checked before creating the renderer. Unsupported contexts get a text alert, not a blank canvas. No remote models, fonts or environment maps are needed.

## Browser evidence

`test/browser-check.cjs` uses an **existing** Playwright install and a headed Chromium/Chrome. It drives only actual keyboard/mouse events and reads the visible HUD; it never writes simulation state. It checks movement/no-op, eight directions, repeat resets, obstacles/walls, goal, orbit, focus handling, narrow layout and denied-WebGL fallback. A 30-second moving run records RAF frame intervals, simulated elapsed time, renderer and console errors. RAF cadence is not a GPU timing measurement or a mobile performance claim.

Example (paths depend on the machine; no package installation required):

```sh
PLAYWRIGHT_PATH=/absolute/path/to/node_modules/playwright \
CHROMIUM_PATH=/absolute/path/to/chromium \
BALL_THRUST_URL=http://127.0.0.1:4170 \
node packages/demo-ball-thrust/test/browser-check.cjs evidence/$(git rev-parse HEAD)
```

The root suite discovers `test/physics.test.ts`. The browser harness is opt-in, not a Vitest test. Evidence includes the exact executed source SHA, screenshots, measured metrics and command output. The evidence-only commit necessarily follows the executed source commit.
