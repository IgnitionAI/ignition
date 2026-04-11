# Tasks: GridWorld Demo

**Feature**: `005-demo-gridworld` | **Date**: 2026-04-11  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup

- [x] T001 Scaffold `packages/demo-gridworld/` with `package.json`, `tsconfig.json`, `vite.config.ts`, `src/index.html`, `src/main.tsx`
- [x] T002 Install dependencies: `react`, `react-dom`, `recharts`, `zustand`, `@ignitionai/backend-tfjs`, `@ignitionai/core` (workspace refs) + dev: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`

## Phase 2: Foundational — GridWorld env logic (TDD)

- [x] T003 Write GridWorld env logic tests (TDD) in `packages/demo-gridworld/test/gridworld-env.test.ts`
  - Test: agent starts at (0,0), target at (gridSize-1, gridSize-1)
  - Test: step(action) moves agent correctly, clamps to bounds
  - Test: reward is +10 at goal, -0.1 per step
  - Test: done() returns true when agent reaches target
  - Test: reset() resets agent to (0,0), clears trail
  - Test: observe() returns normalized [row, col, targetRow, targetCol]

- [x] T004 Implement `gridworld-env.ts` in `packages/demo-gridworld/src/gridworld-env.ts`
  - Pure TS class: `GridWorldEnv { step, reset, observe, reward, done, trail }`
  - Grid size configurable (default 7)
  - Trail: array of visited [row, col] pairs
  - Episode step limit: 100 steps → truncated

- [x] T005 Create Zustand store in `packages/demo-gridworld/src/store.ts`
  - State: `gridState` (agent pos, target pos, trail, gridSize), `rewardHistory` (per-episode rewards), `isTraining`, `episodeCount`, `stepCount`, `algorithm`
  - Actions: `startTraining`, `stopTraining`, `resetTraining`, `setAlgorithm`, `recordEpisode`, `updateGrid`

## Phase 3: User Story 1 — "Look, It Learns" (P1)

**Goal**: Agent visibly learns to navigate the grid. Reward curve goes up.

- [x] T006 [US1] Create `GridCanvas.tsx` in `packages/demo-gridworld/src/GridCanvas.tsx`
  - HTML5 Canvas rendering: grid lines, agent (blue circle), target (green circle)
  - Trail: fading blue dots on visited cells
  - Re-renders from store state
  - Shows episode/step count overlay

- [x] T007 [US1] Create `RewardChart.tsx` in `packages/demo-gridworld/src/RewardChart.tsx`
  - Recharts LineChart: x=episode, y=total reward
  - Updates live from store rewardHistory
  - Dark theme styling, responsive width
  - Cap at 500 data points (downsample if more)

- [x] T008 [US1] Create `Controls.tsx` in `packages/demo-gridworld/src/Controls.tsx`
  - Start/Stop/Reset buttons
  - Algorithm dropdown: DQN, PPO, Q-Table
  - Wired to store actions
  - Reset disposes agent, clears chart, creates fresh agent

- [x] T009 [US1] Create `App.tsx` in `packages/demo-gridworld/src/App.tsx`
  - Layout: 3-column (code | grid | chart), controls bottom
  - Wires IgnitionEnvTFJS with GridWorldEnv
  - Training loop: env.train(algorithm) on Start, env.stop() on Stop
  - On each episode end: push reward to store, update grid

- [x] T010 [US1] Verify visually: `pnpm dev` → open browser → Start → agent learns within 2 minutes

## Phase 4: User Story 2 — Code Showcase (P2)

**Goal**: Code panel shows the 10-line API.

- [x] T011 [US2] Create `CodePanel.tsx` in `packages/demo-gridworld/src/CodePanel.tsx`
  - Read-only code block with syntax highlighting (CSS-only, no extra dep — use `<pre><code>` with manual span coloring)
  - Shows the ~10 lines of IgnitionAI code powering the demo
  - Dark theme, monospace font

## Phase 5: User Story 3 — Algorithm Comparison (P3)

**Goal**: Dropdown switches between DQN/PPO/QTable.

- [x] T012 [US3] Wire algorithm dropdown to env.train(selectedAlgorithm) in `packages/demo-gridworld/src/App.tsx`
  - On algorithm change + Reset: dispose old agent, create new one with selected algo
  - Code panel updates to show the selected algorithm name

## Phase 6: Polish

- [x] T013 Add minimal CSS styling in `packages/demo-gridworld/src/styles.css` — dark theme, clean layout, good spacing
- [x] T014 Run full test suite (all packages) to confirm no regressions

---

## Dependencies

```
T001 → T002 → T003 → T004 → T005 → T006, T007, T008 (parallel) → T009 → T010
T009 → T011
T009 → T012
T010 → T013 → T014
```

## Parallel Opportunities

- **T006 + T007 + T008**: GridCanvas, RewardChart, Controls are independent components

## Implementation Strategy

**MVP**: T001 → T010 (10 tasks). Agent learns on grid, chart shows reward, controls work.

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 14 |
| Story 1 (Look It Learns) | 5 tasks (T006-T010) |
| Story 2 (Code Showcase) | 1 task (T011) |
| Story 3 (Algo Comparison) | 1 task (T012) |
| Setup + Foundational | 5 tasks (T001-T005) |
| Polish | 2 tasks (T013-T014) |
