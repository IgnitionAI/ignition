# Tasks: Environment Auto-Configuration

**Feature**: `004-env-auto-config` | **Date**: 2026-04-11  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup

- [x] T001 Add `AgentFactory` and `AlgorithmType` types in `packages/core/src/types.ts`
- [x] T002 Create defaults merge utility + tests (TDD) in `packages/core/src/defaults.ts` and `packages/core/test/defaults.test.ts`
- [x] T003 Make `agent` optional in `IgnitionEnvConfig` schema in `packages/core/src/schemas.ts`

## Phase 2: Foundational — Core train() API

- [x] T004 Add `actions` field and `train()` / `stop()` lifecycle to `IgnitionEnv` in `packages/core/src/ignition-env.ts`
- [x] T005 Add train() lifecycle tests (TDD) in `packages/core/test/ignition-env.test.ts`
- [x] T006 Update `packages/core/src/index.ts` to export new types (`AgentFactory`, `AlgorithmType`, `mergeDefaults`)

## Phase 3: User Story 1 — Zero-Config Agent Training (P1)

**Goal**: `env.train()` auto-creates a DQN agent and starts training with zero ML config.

**Independent test**: Create env with getObservation returning 4 values + 3 actions → `env.train()` → agent exists, training runs, converges on GridWorld.

- [x] T007 [US1] Create TF.js algorithm defaults in `packages/backend-tfjs/src/defaults.ts`
- [x] T008 [US1] Create `IgnitionEnvTFJS` subclass with agent factories in `packages/backend-tfjs/src/ignition-env-tfjs.ts`
- [x] T009 [US1] Re-export `IgnitionEnvTFJS` as `IgnitionEnv` from `packages/backend-tfjs/src/index.ts`
- [x] T010 [US1] Write auto-config integration test: zero-config DQN creates and trains in `packages/backend-tfjs/test/auto-config.test.ts`

## Phase 4: User Story 2 — Algorithm Selection (P2)

**Goal**: `env.train('ppo')` switches algorithm with correct defaults.

**Independent test**: Same env, call `train('ppo')` → PPO agent created, call `train('qtable')` → QTable agent created.

- [x] T011 [US2] Add PPO and QTable factory + defaults to `IgnitionEnvTFJS` in `packages/backend-tfjs/src/ignition-env-tfjs.ts`
- [x] T012 [US2] Test algorithm switching: DQN → PPO → QTable with correct defaults in `packages/backend-tfjs/test/auto-config.test.ts`
- [x] T013 [US2] Test agent disposal on algorithm switch in `packages/backend-tfjs/test/auto-config.test.ts`

## Phase 5: User Story 3 — Advanced Override (P3)

**Goal**: `env.train('dqn', { lr: 0.01 })` merges overrides with defaults.

**Independent test**: Override `lr` and `hiddenLayers` → agent created with overridden values + default values for the rest.

- [x] T014 [US3] Test partial override merging in `packages/backend-tfjs/test/auto-config.test.ts`
- [x] T015 [US3] Test invalid override rejection (epsilon > 1, negative lr) in `packages/backend-tfjs/test/auto-config.test.ts`

## Phase 6: Polish & Backwards Compatibility

- [x] T016 Verify existing explicit-agent API still works unchanged in `packages/core/test/ignition-env.test.ts`
- [x] T017 Verify `env.agent` read-only property returns the auto-created agent in `packages/backend-tfjs/test/auto-config.test.ts`
- [x] T018 Run full test suite (all packages) to confirm no regressions

---

## Dependencies

```
T001 → T002 → T003 → T004 → T005 → T006
T006 → T007 → T008 → T009 → T010
T010 → T011 → T012, T013 (parallel)
T010 → T014, T015 (parallel)
T010 → T016, T017 (parallel)
T018 depends on all
```

## Parallel Opportunities

- **T012 + T013**: Algorithm switching + disposal tests are independent
- **T014 + T015**: Override merging + validation are independent
- **T016 + T017**: Backwards compat + agent property are independent

## Implementation Strategy

**MVP (User Story 1 only)**: T001 → T010 (10 tasks)
The dev can `env.train()` and get a working DQN. This is the core value.

**Full scope**: All 18 tasks.

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 18 |
| Story 1 (Zero-config) | 4 tasks (T007-T010) |
| Story 2 (Algo selection) | 3 tasks (T011-T013) |
| Story 3 (Overrides) | 2 tasks (T014-T015) |
| Setup + Foundational | 6 tasks (T001-T006) |
| Polish | 3 tasks (T016-T018) |
| Parallel opportunities | 3 |
