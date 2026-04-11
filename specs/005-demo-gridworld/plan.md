# Implementation Plan: GridWorld Demo

**Branch**: `005-demo-gridworld` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

A single-page demo app with a 2D canvas GridWorld, a code panel showing the 10-line API, a live reward chart, and Start/Stop/Reset + algorithm picker. New standalone package `packages/demo-gridworld/`.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict)  
**Primary Dependencies**: React 18, Vite, Recharts, @ignitionai/backend-tfjs (IgnitionEnvTFJS)  
**Testing**: Vitest (GridWorld env logic), manual visual testing  
**Target Platform**: Browser (desktop)  
**Project Type**: Demo web application  

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| TDD | PASS | GridWorld env logic tested. UI is visual — manual verification via Playwright. |
| Modular monorepo | PASS | New standalone package, imports backend-tfjs as a user would |
| Robustness | PASS | Grid bounds checked, episode step limit, graceful stop/reset |
| Browser-first | PASS | Canvas rendering, no heavy deps, fast load |
| Clean API & DX | PASS | The demo IS the DX showcase — 10 lines of code |
| Simplicity & YAGNI | PASS | No dashboard, no network designer, no run comparison. Just the essentials. |

## Project Structure

```text
packages/demo-gridworld/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── index.html
│   ├── main.tsx              # React entry
│   ├── App.tsx               # Layout: code panel | grid | chart + controls
│   ├── GridCanvas.tsx         # Canvas 2D grid renderer
│   ├── RewardChart.tsx        # Recharts live reward curve
│   ├── CodePanel.tsx          # Syntax-highlighted read-only code
│   ├── Controls.tsx           # Start/Stop/Reset + algo dropdown
│   ├── gridworld-env.ts       # GridWorld logic (pure TS, no React)
│   └── styles.css             # Minimal dark theme
└── test/
    └── gridworld-env.test.ts  # GridWorld logic tests
```

## Architecture

### GridWorld env logic (`gridworld-env.ts`)

Pure TypeScript, no React. Manages grid state:
- `row`, `col` — agent position
- `targetRow`, `targetCol` — goal position  
- `grid: number[][]` — visited cells (for trail)
- `step(action)` — move agent, return reward
- `reset()` — reset agent to start, clear trail

This plugs directly into `IgnitionEnvTFJS`:

```ts
const env = new IgnitionEnv({
  getObservation: () => gridworld.observe(),
  actions: ['up', 'right', 'down', 'left'],
  applyAction: (a) => gridworld.step(a),
  computeReward: () => gridworld.reward(),
  isTerminated: () => gridworld.done(),
  onReset: () => gridworld.reset(),
});
env.train();
```

### Canvas rendering (`GridCanvas.tsx`)

- HTML5 Canvas, not DOM cells (performance)
- Draws grid lines, agent (blue circle), target (green circle), trail (fading blue)
- Re-renders on each step via `requestAnimationFrame` or store subscription
- Grid size passed as prop (default 7)

### Data flow

```
GridWorld env logic ←→ IgnitionEnvTFJS (auto-config agent)
        ↓
   Zustand store (gridState, rewardHistory, isTraining, episode)
        ↓
   React components (GridCanvas, RewardChart, Controls)
```

One Zustand store for simplicity. No prop drilling.
