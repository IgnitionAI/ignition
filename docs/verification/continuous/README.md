# Continuous boundary foundation — issue #33

Verified 2026-10-04. The complete SAC plan and predeclared five-seed protocol are under docs/design/continuous-sac.md and sac-point-mass-protocol-v1.json. No SAC learning trial has been run.

The initial additive core API provides explicit continuous environment/experience/agent types and runtime boundary validation. Public validators reject invalid vector dimensions, nonfinite/equal/reversed/overflowing bounds, sparse or malformed observations/actions and out-of-range actions. Validated bounds are frozen copies; returned observations/actions are copies. The two-dimensional asymmetric case independently checks input ownership and per-coordinate bounds. These are public continuous-contract checks, not proof of SAC learning or runner lifecycle.

Validation commands:

```sh
pnpm exec vitest run packages/core/test
pnpm --filter @ignitionai/core build
```

The full current core suite passes; exact counts/results are retained in core-tests.json. Core TypeScript build and git diff --check pass. Existing discrete APIs are unchanged. Review PASS for this additive boundary lot and repository standards.

Not yet delivered: actual SAC networks/updates, checkpoint round-trip, point-mass demo and the predeclared benchmark. All remain required for issue #33, which stays open. This lot must not be represented as SAC availability or successful continuous learning.

## Continuous runner lot

ContinuousRunner serializes explicit and automatic transitions, captures final observations/termination/truncation before reset, validates actions before environment mutation, and copies observations/actions across ownership boundaries. inferStep uses greedy decisions and calls neither remember nor train. stop cancels queued automatic work; awaiting it drains an active transition before the caller disposes its agent. reset is serialized. Invalid rewards/flags reject; automatic errors stop the loop and are exposed as lastError. Agent ownership remains with the caller.

Eight public runner checks cover final-state/reset behavior for termination and truncation, inference without learning, invalid actions before movement, concurrent transition/reset ordering, queued-tick cancellation, automatic error reporting and cursor consistency after optimizer failure. The optimizer-failure regression failed before correction (old observation [1] instead of advanced [1.5]); current state is now updated before learning, so a rejected update cannot rewind the environment cursor. Evidence: cursor-before.json and runner-tests.json.

82 core tests pass, core build passes, strict standalone TypeScript check of the new test passes, and diff check passes. Review PASS for this runner lot. The runner is a genuine continuous execution API, but these contract tests use controlled agents and do not prove SAC learning. SAC implementation and every remaining criterion of #33 are still required.
