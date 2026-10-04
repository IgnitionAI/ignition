# Continuous boundary foundation — issue #33

Verified 2026-10-04. The complete SAC plan and predeclared five-seed protocol are under docs/design/continuous-sac.md and sac-point-mass-protocol-v1.json. No SAC learning trial has been run.

The initial additive core API provides explicit continuous environment/experience/agent types and runtime boundary validation. Public validators reject invalid vector dimensions, nonfinite/equal/reversed/overflowing bounds, sparse or malformed observations/actions and out-of-range actions. Validated bounds are frozen copies; returned observations/actions are copies. The two-dimensional asymmetric case independently checks input ownership and per-coordinate bounds. These are public continuous-contract checks, not proof of SAC learning or runner lifecycle.

Validation commands:

```sh
pnpm exec vitest run packages/core/test
pnpm --filter @ignitionai/core build
```

The full current core suite passes; exact counts/results are retained in core-tests.json. Core TypeScript build and git diff --check pass. Existing discrete APIs are unchanged. Review PASS for this additive boundary lot and repository standards.

Not yet delivered: point-mass demo and the predeclared benchmark. SAC networks, updates and JSON checkpoint round-trip are now locally verified below. All remain required for issue #33, which stays open. This lot must not be represented as SAC availability or successful continuous learning.

## Continuous runner lot

ContinuousRunner serializes explicit and automatic transitions, captures final observations/termination/truncation before reset, validates actions before environment mutation, and copies observations/actions across ownership boundaries. inferStep uses greedy decisions and calls neither remember nor train. stop cancels queued automatic work; awaiting it drains an active transition before the caller disposes its agent. reset is serialized. Invalid rewards/flags reject; automatic errors stop the loop and are exposed as lastError. Agent ownership remains with the caller.

Eight public runner checks cover final-state/reset behavior for termination and truncation, inference without learning, invalid actions before movement, concurrent transition/reset ordering, queued-tick cancellation, automatic error reporting and cursor consistency after optimizer failure. The optimizer-failure regression failed before correction (old observation [1] instead of advanced [1.5]); current state is now updated before learning, so a rejected update cannot rewind the environment cursor. Evidence: cursor-before.json and runner-tests.json.

82 core tests pass, core build passes, strict standalone TypeScript check of the new test passes, and diff check passes. Review PASS for this runner lot. The runner is a genuine continuous execution API, but these contract tests use controlled agents and do not prove SAC learning. SAC learning competency, the demo and every remaining criterion of #33 are still required.

## Fixed-temperature SAC and JSON checkpoint lot

SACAgent implements a seeded Gaussian actor with tanh/affine action bounds, twin critics, frozen Bellman targets and Polyak target updates. Actor and critic optimizers receive separate explicit variable lists. Terminal transitions suppress bootstrap; truncations keep it. Defaults match the predeclared plan. The caller selects/awaits the TensorFlow.js backend; proofs here explicitly select CPU. Runtime input/action/configuration checks reject malformed values and bounds unrepresentable in float32. Configuration is copied/frozen.

The six SAC tests exercise real training and public checkpoint boundaries. They establish changed actor/critic weights, exact Polyak interpolation within float tolerance, inference with unchanged weights/counters/RNG, stable tensor count across repeated updates and full disposal. Constant target-critic checkpoints independently distinguish twin minimum and termination/truncation by exact Bellman-loss values (2 versus 8). Independent Gaussian quadrature checks the sampled entropy loss including tanh and per-dimension scale Jacobians; critics remain unchanged during this actor-only entropy case. JSON round-trip recreates identical greedy outputs, and incompatible/corrupt artifacts leave existing weights unchanged.

Checkpoints contain all five networks, bounded-action/configuration contract, counters and RNG. Loading validates the complete artifact/shapes before assigning weights, and creates fresh optimizers/replay. It is a warm resume, not exact optimizer/replay continuation. Training losses are read-only progress diagnostics and reset on load. No remote storage claim is made.

Commands: pnpm exec vitest run packages/backend-tfjs/test; pnpm --filter @ignitionai/backend-tfjs build; strict standalone tsc check of packages/backend-tfjs/test/sac.test.ts. 117 backend tests pass; three authenticated Hugging Face tests are skipped without the required secret. Build and strict type check pass. Exact suite results are retained in sac-backend-tests.json. Review PASS for the implemented algorithm/checkpoint lot. Full issue learning acceptance is still NOT PROVEN: no point-mass benchmark or browser demo has yet been run. No protocol threshold, seed or budget was changed.

## Point-mass task and benchmark harness

The shared environment implements the predeclared physical/reward equations, acceleration bounds, 100-tick truncation, |position|>3 termination and last-ten-tick success predicate. Two physical-boundary tests plus the six SAC tests pass; strict TypeScript for task/tests/harness and diff check pass. The benchmark freezes its manifest/source hashes before initialization or evaluation, refuses overwrite, retains all baseline/final-policy episodes and failed seeds, checks identical initial evaluation scenarios and unchanged checkpoints during evaluation. A complete five-seed run is still required; no learning outcome is claimed by the harness alone.
