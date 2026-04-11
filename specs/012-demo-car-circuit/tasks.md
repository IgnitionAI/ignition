# Tasks: Car on Circuit Demo

**Feature**: `012-demo-car-circuit` | **Date**: 2026-04-11

## Phase 1: Scaffold

- [x] T001 Scaffold `packages/demo-car-circuit/` — package.json, tsconfig, vite.config, html, main, styles

## Phase 2: Track Geometry + Physics (TDD)

- [x] T002 Write track geometry tests in `test/track.test.ts` — nearest point, distance, angle
- [x] T003 Implement `track.ts` — oval centerline waypoints, nearest point on track, signed distance, track direction
- [x] T004 Write circuit env tests in `test/circuit-env.test.ts` — observe, step, reward, done, reset
- [x] T005 Implement `circuit-env.ts` — CircuitEnv implements TrainingEnv with car physics + track-relative observations

## Phase 3: 3D Scene

- [x] T006 Create `Track3D.tsx` — oval track surface mesh, edge lines, start line marker
- [x] T007 Create `Car3D.tsx` — low-poly car mesh (rounded box + 4 cylinder wheels, or .glb if available)
- [x] T008 Create `Scene3D.tsx` — R3F Canvas, lighting, shadows, chase camera following car

## Phase 4: UI + Integration

- [x] T009 Create `store.ts` — car state, mode, rewardHistory, algorithm
- [x] T010 [P] Create `Controls.tsx` + `RewardChart.tsx` + `CodePanel.tsx`
- [x] T011 Create `App.tsx` — wire CircuitEnv + IgnitionEnvTFJS + 3D + UI

## Phase 5: Validate

- [x] T012 Start dev server, verify car trains and learns to stay on track
- [x] T013 Run full test suite — zero regressions

## Dependencies

```
T001 → T002 → T003 → T004 → T005
T005 → T006, T007, T008 (parallel)
T005 → T009 → T010 → T011
T011 → T012 → T013
```

## Summary

| Total | 13 tasks |
