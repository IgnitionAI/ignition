# Tasks: Formal Environment Interfaces

**Feature**: `008-env-interface` | **Date**: 2026-04-11

## Phase 1: Setup — Define interfaces

- [x] T001 Add `TrainingEnv` and `InferenceEnv` interfaces to `packages/core/src/types.ts`
- [x] T002 Add `validateTrainingEnv()` and `validateInferenceEnv()` validation functions + tests (TDD) in `packages/core/src/env-validation.ts` and `packages/core/test/env-validation.test.ts`

## Phase 2: Core — Rewrite IgnitionEnv

- [x] T003 Rewrite `IgnitionEnv` constructor to accept `TrainingEnv` object in `packages/core/src/ignition-env.ts`
- [x] T004 Remove old `IgnitionEnvConfigSchema` and callback types from `packages/core/src/schemas.ts`
- [x] T005 Update `packages/core/src/index.ts` exports
- [x] T006 Rewrite core tests for new API in `packages/core/test/ignition-env.test.ts`

## Phase 3: Backend-tfjs — Update IgnitionEnvTFJS

- [x] T007 Update `IgnitionEnvTFJS` constructor in `packages/backend-tfjs/src/ignition-env-tfjs.ts`
- [x] T008 Update auto-config tests in `packages/backend-tfjs/test/auto-config.test.ts`

## Phase 4: Backend-onnx — Add IgnitionInferenceEnv

- [x] T009 Create `IgnitionInferenceEnv` class in `packages/backend-onnx/src/inference-env.ts`
- [x] T010 Add inference env tests in `packages/backend-onnx/src/tests/inference-env.test.ts`
- [x] T011 Update `packages/backend-onnx/src/index.ts` exports

## Phase 5: Migrate demos

- [x] T012 [P] Migrate `demo-gridworld`: GridWorldEnv implements TrainingEnv + simplify App.tsx
- [x] T013 [P] Migrate `demo-cartpole`: CartPoleEnv implements TrainingEnv + simplify App.tsx
- [x] T014 [P] Migrate `demo-mountaincar`: MountainCarEnv implements TrainingEnv + simplify App.tsx

## Phase 6: Validate

- [x] T015 Run full test suite — all packages, zero regressions
- [x] T016 Start each demo server — verify they load and train

## Dependencies

```
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008
T001 → T009 → T010 → T011
T008 → T012, T013, T014 (parallel)
T012, T013, T014 → T015 → T016
```

## Summary

| Total | 16 tasks |
