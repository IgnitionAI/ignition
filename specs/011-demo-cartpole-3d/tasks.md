# Tasks: CartPole 3D Hero Demo

**Feature**: `011-demo-cartpole-3d` | **Date**: 2026-04-11

## Phase 1: Scaffold

- [x] T001 Scaffold `packages/demo-cartpole-3d/` with package.json (R3F + drei + three + recharts + zustand), tsconfig, vite.config, index.html, main.tsx, styles.css

## Phase 2: 3D Scene

- [x] T002 Create `Scene3D.tsx` — R3F Canvas with lighting, shadows, environment, OrbitControls
- [x] T003 Create `Cart.tsx` — metallic box mesh positioned at state.x
- [x] T004 Create `Pole.tsx` — cylinder mesh rotated by state.theta, pivoted on cart top
- [x] T005 Create `Rail.tsx` — ground plane + track line

## Phase 3: Integration

- [x] T006 Create `store.ts` — CartPoleState, mode, rewardHistory, algorithm
- [x] T007 Create `Controls.tsx` — Train/Inference/Stop/Reset + DQN/PPO dropdown
- [x] T008 Create `RewardChart.tsx` — episode length chart
- [x] T009 Create `CodePanel.tsx` — 10-line API showcase
- [x] T010 Create `App.tsx` — wire CartPoleEnv + IgnitionEnvTFJS + 3D scene + UI

## Phase 4: Validate

- [x] T011 Start dev server, verify 3D scene renders + training works + inference works
- [x] T012 Run full test suite — zero regressions across all packages

## Summary

| Total | 12 tasks |
