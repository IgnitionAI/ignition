# Spec: Demo — Drone Navigation (Rapier physics)

**Branch**: `main` (direct) | **Created**: 2026-04-14 | **Parent**: 014-docs-complete (demo routing)

## Summary

A 3D quadcopter that learns to fly to moving target points using real Rapier physics. This is the first IgnitionAI demo with a proper physics engine (Rapier via `@react-three/rapier`), and the intended "hero demo" for v0.2. The existing Car Circuit uses hand-rolled kinematics; this one uses rigid-body dynamics with gravity, collisions, and torque from asymmetric thrust.

## User Story (P1)

A visitor who has already seen the Car Circuit demo wants to know what IgnitionAI can do with real physics. They open `/demos/drone-navigation/`, click Train, and within a few minutes watch a quadcopter go from uncontrolled tumbling to stable hover to navigating between target points.

**Independent test**: A visitor with no context spawns the page, hits Train, waits 3–5 minutes at `setSpeed(50)`, and observes:
1. The drone transitions from random flailing → stable hover → directed flight
2. The target sphere respawns each time the drone reaches it
3. The drone survives multiple consecutive target captures without crashing

**Acceptance scenarios**:
1. Page at `/demos/drone-navigation/` loads and renders: quadcopter, target sphere, ground plane, skybox.
2. Training starts on button click; reward chart updates live.
3. After ~3 min at speed 50×, the drone can capture ≥5 targets in a row during inference mode.
4. `← IgnitionAI` back link is present (same pattern as the other demos).

## Functional Requirements

**Physics environment**
- **FR-1**: The env uses `@react-three/rapier` rigid bodies. The drone is a single dynamic body; the ground is a fixed collider.
- **FR-2**: Four thrusters are applied as forces at the drone's corners, producing lift (+Y) and torque from asymmetry.
- **FR-3**: Gravity is realistic (~9.8 m/s² or a scaled equivalent). Mass, thrust ceiling, and drag are tuned so the drone is stable-but-not-trivial to control.
- **FR-4**: A target sphere spawns at a random point within a 6×4×6 m volume. When the drone center reaches within 0.4 m, a new target is spawned.

**Training env interface**
- **FR-5**: The env implements `TrainingEnv` from `@ignitionai/core`.
- **FR-6**: `actions` = 8 discrete thrust combinations (full/half power × 4 attitude combos: hover, forward-tilt, back-tilt, left-tilt, right-tilt).
- **FR-7**: `observe()` returns 13 normalized floats: position (3), velocity (3), euler orientation (3), angular velocity (3), plus target-delta vector length (1). All values clamped/scaled to roughly `[-1, 1]`.
- **FR-8**: `reward()` = `-distance_to_target × 0.1` (dense) + `+50` on target capture + `-20` on crash + `-0.01 × |angularVelocity|` (anti-spin penalty).
- **FR-9**: `done()` returns true on crash (drone ground contact) or on episode timeout (1000 steps).
- **FR-10**: `reset()` respawns the drone at `(0, 2, 0)` with zero velocity, randomizes the target.

**Scene & UX**
- **FR-11**: A React Three Fiber scene with: drone mesh (box or simple quadcopter model), 4 rotor indicators, target sphere with pulsing emissive, ground plane, ambient + directional lighting.
- **FR-12**: Camera follows the drone at a fixed offset behind-and-above.
- **FR-13**: HUD overlay shows episode, steps, captures, mode.
- **FR-14**: Controls panel with Train / Infer / Reset buttons + speed slider (reused from existing demos).
- **FR-15**: Back link `← IgnitionAI` pointing to `/`, same style as other demos.

**Build integration**
- **FR-16**: Package lives at `packages/demo-drone-navigation/` with its own `vite.config.ts`, `package.json`, `tsconfig.json`.
- **FR-17**: The demo is added to `packages/web/scripts/build-demos.mjs` with slug `drone-navigation`.
- **FR-18**: The landing page's demo grid (`packages/web/components/demos.tsx`) adds a 6th card linking to `/demos/drone-navigation/`.

## Success Criteria

- **SC-1**: A naive visitor reaches the first target within 5 minutes of wall-clock time at default speed settings.
- **SC-2**: After ~5 minutes of training, the drone captures at least 3 consecutive targets during inference without crashing in ≥70% of runs.
- **SC-3**: The demo builds cleanly via `pnpm --filter web build` and deploys to `/demos/drone-navigation/` on Vercel.
- **SC-4**: Bundle size for the demo (including Rapier WASM) stays under 6 MB gzipped.
- **SC-5**: No frame drops on the main thread during training at speed 10× on a modern laptop.

## Assumptions

- Use `@react-three/rapier` for physics — it's already in the constitution's tech stack and battle-tested for R3F.
- Discrete action space (8 combos) is enough for a compelling demo. Continuous PPO with per-motor thrust can come later once we have SAC.
- No multi-agent, no wind disturbance, no obstacles (v2 material).
- The drone is deliberately styled as a simple box with 4 rotor indicators — we're selling "the physics works", not "the model is pretty".
- Target spawning is uniform random within a fixed volume; curriculum learning is out of scope.
