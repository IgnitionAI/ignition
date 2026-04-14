# Spec: Tutorial — Drone Navigation with Custom Physics

**Branch**: `main` (direct) | **Created**: 2026-04-14 | **Parent**: 014-docs-complete

## Summary

Add `/docs/tutorials/drone-navigation.mdx`. Walks the reader through building a quadcopter environment from scratch — hand-rolled rigid-body physics (gravity, drag, torque, inertia, asymmetric thrust), 8-action discretization, reward shaping for 6-DOF flight control, and **an honest conversation about convergence time**.

The tutorial is the flagship expression of the IgnitionAI philosophy: *we don't make RL easy, we remove the friction between brain and software*. Training a drone to fly still takes 500–2000 episodes. But the feedback loop — from "I have an idea" to "I see it running" — is minutes, not weeks. That's the win.

## User Story (P1)

A reader finishes the CartPole 3D tutorial and wants to build something harder — a 3D task with real physics, not hand-coded physics from a textbook. They open this tutorial, follow the steps, and come away with (a) a working drone env, (b) an understanding of why quadcopter control is non-trivial, and (c) realistic expectations about training time.

**Independent test**: A dev with no prior drone RL experience can complete the tutorial in ~40 minutes and get their drone tumbling-but-learning by the end. They understand why the first 100 episodes show no visible improvement, and they know which levers to pull if it doesn't converge after 1000.

**Acceptance scenarios**:
1. Reader builds `DroneEnv` from scratch following sequential steps with complete code blocks.
2. Reader understands why we chose 8 discrete actions over 4 continuous thrust values (PPO continuous comes later).
3. Reader understands the reward shaping choices and can tweak them experimentally.
4. Reader reads the "Honest convergence expectations" section and walks away without false hopes OR despair.

## Functional Requirements

**Content**
- **FR-1**: Page at `packages/web/content/tutorials/drone-navigation.mdx`.
- **FR-2**: `tutorials/_meta.js` updated with `'drone-navigation': 'Drone Navigation (physics)'`.
- **FR-3**: Uses the published `@ignitionai/core` + `@ignitionai/backend-tfjs` packages. Scene code uses `@react-three/fiber` + `@react-three/drei`. No unpublished deps.
- **FR-4**: Contains a "Why drones are hard" section explaining 4 rotors × 6 DOF × non-linear coupling in plain language, with the classical-control contrast (PID cascades take weeks).
- **FR-5**: Sequential steps for building `DroneEnv`: constants, state, observe, step with physics, reward shaping, done, reset. Full code, filename on each block.
- **FR-6**: Dedicated "Honest convergence expectations" section with numbers: expect 500–2000 episodes before clean flight, first 100 are garbage, that's normal for 6-DOF control. Explains WHY (exploration must cover a huge state × action space before DQN's gradient points anywhere useful).
- **FR-7**: Dedicated "The IgnitionAI philosophy" section framing the tutorial as "the friction win, not the difficulty win" — contrasting with ROS/Gazebo/CUDA/weeks pipelines.
- **FR-8**: "What to try when it doesn't converge" section with concrete tweaks (reward weights, action discretization, exploration decay).
- **FR-9**: Next steps pointing to the ONNX tutorial (deploying the trained drone to Unity/Unreal) and the algorithms pages.

**Pedagogical consistency**
- **FR-10**: Follows the Tutorial skeleton from `specs/014-docs-complete/data-model.md` (front-matter, prerequisites, sequential steps with code/filename/observation/rationale, final state, next steps, Prev/Next links).

## Success Criteria

- **SC-1**: Reader finishes in ~40 minutes and has a drone env that can be instantiated and trained (not necessarily converged).
- **SC-2**: Reader can answer "why does the drone tumble for the first 100 episodes?" without re-reading the page.
- **SC-3**: Build passes (`pnpm --filter web build`).
- **SC-4**: The "IgnitionAI philosophy" section is quotable — a single paragraph a reader could paste into a Show HN comment.

## Assumptions

- The drone demo (spec 020) is already live at `/demos/drone-navigation/` so the tutorial can link to it as a "finished reference."
- Hand-rolled physics (semi-implicit Euler) is the right pedagogical entry point. Rapier comes later if we want a harder demo with contact dynamics.
- PPO continuous actions for drone flight are out of scope — this tutorial uses DQN with 8 discretized combos.
