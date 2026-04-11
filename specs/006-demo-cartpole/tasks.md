# Tasks: CartPole Demo

**Feature**: `006-demo-cartpole` | **Date**: 2026-04-11  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup

- [x] T001 Scaffold `packages/demo-cartpole/` with package.json, tsconfig, vite.config, index.html, main.tsx, styles.css

## Phase 2: Foundational — CartPole physics (TDD)

- [x] T002 Write CartPole physics tests in `packages/demo-cartpole/test/cartpole-env.test.ts`
- [x] T003 Implement `cartpole-env.ts` in `packages/demo-cartpole/src/cartpole-env.ts`
- [x] T004 Create Zustand store in `packages/demo-cartpole/src/store.ts`

## Phase 3: User Story 1 — "The Pole Stays Up" (P1)

- [x] T005 [P] [US1] Create `CartPoleCanvas.tsx` in `packages/demo-cartpole/src/CartPoleCanvas.tsx`
- [x] T006 [P] [US1] Create `RewardChart.tsx` in `packages/demo-cartpole/src/RewardChart.tsx`
- [x] T007 [P] [US1] Create `Controls.tsx` in `packages/demo-cartpole/src/Controls.tsx`
- [x] T008 [US1] Create `App.tsx` wiring env + components in `packages/demo-cartpole/src/App.tsx`
- [x] T009 [US1] Create `CodePanel.tsx` in `packages/demo-cartpole/src/CodePanel.tsx`
- [x] T010 [US1] Visual verification: pnpm dev → Start → pole balances after training

## Phase 4: Polish

- [x] T011 Run full test suite to confirm no regressions

## Dependencies

```
T001 → T002 → T003 → T004 → T005,T006,T007 (parallel) → T008 → T009 → T010 → T011
```

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 11 |
| MVP | T001-T010 |
