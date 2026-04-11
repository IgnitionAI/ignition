# Tasks: Demo Inference Mode

**Feature**: `009-demo-inference-mode` | **Date**: 2026-04-11

## Phase 1: Core — Add inferStep() to IgnitionEnv

- [x] T001 Add `inferStep()` and `infer()` methods to `packages/core/src/ignition-env.ts`
- [x] T002 Add inference tests in `packages/core/test/ignition-env.test.ts`

## Phase 2: Agents — Support greedy mode

- [x] T003 Add greedy getAction to DQN (epsilon=0 override) in `packages/backend-tfjs/src/agents/dqn.ts`
- [x] T004 Add greedy getAction to PPO (argmax, no sampling) in `packages/backend-tfjs/src/agents/ppo.ts`
- [x] T005 Add greedy getAction to QTable (epsilon=0) in `packages/backend-tfjs/src/agents/qtable.ts`

## Phase 3: Demos — Add inference toggle

- [x] T006 [P] Add inference mode to demo-gridworld: store + Controls + App + canvas border
- [x] T007 [P] Add inference mode to demo-cartpole: store + Controls + App + canvas border
- [x] T008 [P] Add inference mode to demo-mountaincar: store + Controls + App + canvas border

## Phase 4: Validate

- [x] T009 Run full test suite
- [x] T010 Start demos and verify Training ↔ Inference toggle

## Summary

| Total | 10 tasks |
