# Continuous boundary foundation — issue #33

Verified 2026-10-04. The complete SAC plan and predeclared five-seed protocol are under docs/design/continuous-sac.md and sac-point-mass-protocol-v1.json. No SAC learning trial has been run.

The initial additive core API provides explicit continuous environment/experience/agent types and runtime boundary validation. Public validators reject invalid vector dimensions, nonfinite/equal/reversed/overflowing bounds, sparse or malformed observations/actions and out-of-range actions. Validated bounds are frozen copies; returned observations/actions are copies. The two-dimensional asymmetric case independently checks input ownership and per-coordinate bounds. These are public continuous-contract checks, not proof of SAC learning or runner lifecycle.

Validation commands:

```sh
pnpm exec vitest run packages/core/test
pnpm --filter @ignitionai/core build
```

The full current core suite passes; exact counts/results are retained in core-tests.json. Core TypeScript build and git diff --check pass. Existing discrete APIs are unchanged. Review PASS for this additive boundary lot and repository standards.

Not yet delivered: continuous runner, actual SAC networks/updates, checkpoint round-trip, point-mass demo and the predeclared benchmark. All remain required for issue #33, which stays open. This lot must not be represented as SAC availability or successful continuous learning.
