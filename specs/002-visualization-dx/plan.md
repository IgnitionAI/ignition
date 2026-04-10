# Implementation Plan: Visualization & Developer Experience

**Branch**: `002-visualization-dx` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)

## Summary

Complete Phase 5 of IgnitionAI by making the React Flow Network Designer functional (drives agent creation) and adding a training dashboard with run comparison. All work targets `packages/demo-target-chasing/`.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict mode)  
**Primary Dependencies**: React 18, React Flow (already integrated), Recharts (already integrated), Zustand (state management), @ignitionai/core, @ignitionai/backend-tfjs  
**Storage**: localStorage (run persistence)  
**Testing**: Vitest (unit tests for state logic, React Testing Library for components)  
**Target Platform**: Browser (Chrome/Firefox/Safari, desktop)  
**Project Type**: Demo web application (Vite + React + R3F)  
**Performance Goals**: 60fps during training visualization, chart updates at most every 100ms  
**Constraints**: No new heavy dependencies; localStorage < 5MB typical limit  
**Scale/Scope**: Single demo app, up to 100 training runs with 1000 episodes each

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| TDD (non-negotiable) | PASS | Tests for: Zustand stores, graph-to-config mapping, run persistence logic |
| Modular monorepo | PASS | All changes in demo-target-chasing, no new packages |
| Robustness & defensive design | PASS | Zod validation on config from graph, graceful localStorage overflow handling |
| Browser-first, performance-aware | PASS | Debounced chart updates, capped chart data points, lazy rendering |
| Clean API & DX | PASS | Existing IgnitionEnv callbacks (onStep, onEpisodeEnd) drive dashboard — no core changes |
| Simplicity & YAGNI | PASS | No abstractions beyond Zustand stores; React Flow already present |

No violations.

## Project Structure

### Source Code

```text
packages/demo-target-chasing/src/
├── components/
│   ├── NetworkDesigner/
│   │   ├── NetworkDesigner.tsx       # React Flow canvas with custom nodes
│   │   ├── DenseLayerNode.tsx        # Custom node: editable unit count
│   │   ├── InputOutputNode.tsx       # Fixed input/output nodes
│   │   └── graphToConfig.ts          # Convert React Flow graph → hiddenLayers[]
│   ├── Dashboard/
│   │   ├── Dashboard.tsx             # Main dashboard container
│   │   ├── RunList.tsx               # List of training runs with selection
│   │   ├── RunChart.tsx              # Overlaid Recharts line charts
│   │   └── RunControls.tsx           # Rename, delete, export buttons
│   └── ... (existing components)
├── stores/
│   ├── networkStore.ts               # Zustand: graph state ↔ hiddenLayers sync
│   └── runStore.ts                   # Zustand: training runs, persistence, selection
├── types/
│   └── runs.ts                       # TrainingRun, RunMetrics types
└── ... (existing files)

packages/demo-target-chasing/test/
├── graphToConfig.test.ts             # Graph → hiddenLayers mapping
├── networkStore.test.ts              # Bidirectional sync logic
├── runStore.test.ts                  # Run CRUD, persistence, selection
└── runChart.test.ts                  # Chart data transformation
```

## Architecture Decisions

### 1. Network Designer → Agent Config Pipeline

The React Flow graph is the **source of truth** for network architecture. The pipeline:

```
React Flow graph (nodes/edges)
  → graphToConfig(nodes, edges) → hiddenLayers: number[]
  → Zustand networkStore (syncs with config panel)
  → "Apply" button → dispose old agent → new DQNAgent/PPOAgent(config)
```

`graphToConfig` is a pure function: extract Dense nodes in topological order, read their `units` property, return `number[]`. This is the critical testable unit.

Bidirectional sync: when the config panel changes `hiddenLayers`, the store rebuilds the React Flow nodes. When the graph changes, the store updates `hiddenLayers`. One Zustand store, two subscribers.

### 2. Training Dashboard Data Flow

The dashboard hooks into IgnitionEnv's existing `callbacks.onStep` and `callbacks.onEpisodeEnd`:

```
IgnitionEnv.step()
  → callbacks.onStep(result, stepCount)    → runStore.recordStep()
  → callbacks.onEpisodeEnd(stepCount)      → runStore.endEpisode()
```

No changes to `@ignitionai/core`. The demo wires callbacks when creating IgnitionEnv.

### 3. Run Persistence

Zustand with `persist` middleware → localStorage. Each run is serialized as:

```json
{
  "id": "run_1712764800000",
  "name": "DQN lr=0.001",
  "config": { "inputSize": 4, "actionSize": 2, ... },
  "episodes": [
    { "episode": 1, "reward": -2.3, "epsilon": 0.95, "steps": 25 },
    ...
  ],
  "startedAt": "2026-04-10T14:00:00Z",
  "endedAt": "2026-04-10T14:05:00Z"
}
```

Cap: 100 runs max, oldest auto-pruned. Per-run cap: 2000 episodes. Estimated storage: ~200KB per run → ~20MB for 100 runs (within localStorage limits).

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| React Flow custom nodes don't support inline editing | Low | React Flow supports custom node components with any React content |
| localStorage quota exceeded | Medium | Auto-prune oldest runs, warn user, offer export before deletion |
| Chart performance with 5 overlaid series x 1000 points | Low | Downsample to 200 points per series for display, keep full data in store |
| Bidirectional sync causes infinite loop | Medium | Use Zustand `subscribeWithSelector` + a `source` flag to break cycles |
