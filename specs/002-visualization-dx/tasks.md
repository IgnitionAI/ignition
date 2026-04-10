# Tasks: Visualization & Developer Experience

**Feature**: `002-visualization-dx` | **Date**: 2026-04-10  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup

- [x] **T1** [setup] Create Zustand stores skeleton and types
  - Files: `src/stores/networkStore.ts`, `src/stores/runStore.ts`, `src/types/runs.ts`
  - Define `TrainingRun`, `RunMetrics`, `RunStore` types
  - Define `NetworkStore` with `nodes`, `edges`, `hiddenLayers` state
  - Install `zustand` persist middleware if not present
  - Test: stores initialize without errors

- [x] **T2** [setup] Create `graphToConfig.ts` pure function + tests (TDD)
  - File: `src/components/NetworkDesigner/graphToConfig.ts`
  - Test file: `test/graphToConfig.test.ts`
  - Input: React Flow `Node[]` and `Edge[]`
  - Output: `number[]` (hiddenLayers) — extract Dense nodes in topological edge order, read `units` data
  - Tests: empty graph → `[]`, single node → `[64]`, chain → `[64, 128, 64]`, disconnected nodes → error

## Phase 2: Foundational — Network Store with Bidirectional Sync

- [x] **T3** [core] Implement `networkStore` with bidirectional sync + tests (TDD)
  - File: `src/stores/networkStore.ts`
  - Test file: `test/networkStore.test.ts`
  - Actions: `setGraph(nodes, edges)` → recomputes `hiddenLayers` via `graphToConfig`
  - Actions: `setHiddenLayers(layers)` → rebuilds nodes/edges from `number[]`
  - Use a `source` flag (`'graph' | 'config' | null`) to prevent infinite sync loops
  - Tests: graph change updates hiddenLayers, hiddenLayers change updates graph, no infinite loop

## Phase 3: User Story 1 — Visual Network Architecture Builder (P1)

**Goal**: Drag-and-drop Dense nodes to define network architecture, "Apply" recreates the agent.

**Independent test**: Open demo → drag nodes → Apply → agent trains with new architecture.

- [x] **T4** [ui] Create `DenseLayerNode` custom React Flow node
  - File: `src/components/NetworkDesigner/DenseLayerNode.tsx`
  - Displays unit count (e.g. "Dense 64"), click to edit inline (input field)
  - On edit confirm: update node data, trigger `networkStore.setGraph()`
  - Has delete handle (X button)

- [x] **T5** [ui] Create `InputOutputNode` custom React Flow node
  - File: `src/components/NetworkDesigner/InputOutputNode.tsx`
  - Read-only display: "Input (4)" and "Output (2)" showing inputSize/actionSize
  - Not deletable, not editable

- [x] **T6** [ui] Refactor `NetworkDesigner.tsx` to use custom nodes + store
  - File: `src/components/NetworkDesigner/NetworkDesigner.tsx`
  - Replace current visual-only React Flow with functional version
  - Initialize graph from current `hiddenLayers` config via `networkStore`
  - Toolbar: "Add Dense Layer" button (inserts node before output, default 64 units)
  - Node deletion: remove node + reconnect edges automatically
  - All graph mutations go through `networkStore.setGraph()`

- [x] **T7** [ui] Wire config panel ↔ Network Designer bidirectional sync
  - When config panel `hiddenLayers` changes → `networkStore.setHiddenLayers()` → graph updates
  - When graph changes → `networkStore` → config panel reflects new `hiddenLayers`
  - "Apply" button: reads `hiddenLayers` from store, disposes old agent, creates new agent, shows notification

- [x] **T8** [test] Integration test: graph → agent creation
  - Test file: `test/networkDesigner.integration.test.ts`
  - Verify: modify graph → click Apply → new DQNAgent has correct `hiddenLayers`
  - Verify: mid-training Apply → training stops, agent disposed, new agent created

## Phase 4: User Story 2 — Training Dashboard with Run Comparison (P2)

**Goal**: Record training runs, display metrics, overlay up to 5 runs on the same chart.

**Independent test**: Start two runs with different configs → select both → curves overlaid.

- [x] **T9** [core] Implement `runStore` with persistence + tests (TDD)
  - File: `src/stores/runStore.ts`
  - Test file: `test/runStore.test.ts`
  - State: `runs: TrainingRun[]`, `selectedRunIds: string[]`, `activeRunId: string | null`
  - Actions: `startRun(config)`, `recordEpisode(metrics)`, `endRun()`, `selectRun(id)`, `deselectRun(id)`, `renameRun(id, name)`, `deleteRun(id)`, `exportRun(id) → JSON`
  - Persist to localStorage via Zustand `persist` middleware
  - Auto-prune: keep max 100 runs, oldest first
  - Tests: CRUD operations, persistence round-trip, auto-prune, selection logic

- [x] **T10** [ui] Create `RunList.tsx` component
  - File: `src/components/Dashboard/RunList.tsx`
  - List all runs: name, date, episode count, final reward
  - Checkbox selection (max 5)
  - Inline rename (click name to edit)
  - Delete button with confirmation
  - Sort by: date (default), final reward, episode count

- [x] **T11** [ui] Create `RunChart.tsx` component
  - File: `src/components/Dashboard/RunChart.tsx`
  - Recharts `LineChart` with overlaid series for selected runs
  - X-axis: episode number, Y-axis: reward (primary), epsilon (secondary)
  - Distinct colors per run, legend with run names
  - Downsample to 200 points per series if > 200 episodes
  - Responsive width

- [x] **T12** [ui] Create `Dashboard.tsx` container + wire IgnitionEnv callbacks
  - File: `src/components/Dashboard/Dashboard.tsx`
  - Layout: RunList (left panel) + RunChart (main area)
  - "New Run" button: starts a new run entry via `runStore.startRun(config)`
  - Wire `IgnitionEnv` callbacks: `onStep` → update live metrics, `onEpisodeEnd` → `runStore.recordEpisode()`
  - "Export JSON" button for selected run

- [x] **T13** [test] Integration test: run recording + chart display
  - Test file: `test/dashboard.integration.test.ts`
  - Verify: start run → step through episodes → run appears in list with correct metrics
  - Verify: select 2 runs → chart shows both series with correct data

## Phase 5: User Story 3 — Run Persistence and Export (P3)

**Goal**: Runs survive page reload, can be exported as JSON.

- [x] **T14** [core] Verify localStorage persistence round-trip
  - Test file: `test/runStore.test.ts` (add to existing)
  - Serialize store → clear → rehydrate → verify all runs intact
  - Test export: `runStore.exportRun(id)` returns valid JSON with config + episodes

- [x] **T15** [ui] Add sort controls and export button to RunList
  - Add sort dropdown to RunList header
  - Add "Export JSON" button per run → triggers browser download
  - Add "Clear All" button with confirmation dialog

## Phase 6: Polish & Edge Cases

- [x] **T16** [edge] Handle zero hidden layers
  - graphToConfig returns `[]` for graph with only input→output edge
  - Show warning tooltip: "No hidden layers — linear model"
  - Agent still creates successfully

- [x] **T17** [edge] Handle localStorage overflow
  - Wrap `persist` with try/catch
  - On quota exceeded: show notification, auto-prune 10 oldest runs, retry
  - If still failing: disable persistence, warn user, continue training

- [x] **T18** [polish] Add notifications for agent lifecycle events
  - Toast/notification on: "Agent recreated with [64, 128, 64]", "Training reset", "Run saved", "Export complete"
  - Use a simple notification system (Zustand store + CSS animation, no new dependency)

---

## Dependencies

```
T1 → T2 → T3 → T4, T5, T6 (parallel) → T7 → T8
T1 → T9 → T10, T11 (parallel) → T12 → T13
T9 → T14 → T15
T3 → T16
T9 → T17
T7, T12 → T18
```

## Parallel Opportunities

- **T4 + T5**: Dense node and Input/Output node can be built simultaneously
- **T6 + T9**: Network Designer refactor and Run Store are independent
- **T10 + T11**: RunList and RunChart are independent UI components

## Implementation Strategy

**MVP (User Story 1 only)**: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8  
A developer can visually design a network and train with it. ~8 tasks.

**Full scope**: All 18 tasks. Story 2 and 3 can be built after Story 1 ships.

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 18 |
| Story 1 (Network Designer) | 8 tasks (T1-T8) |
| Story 2 (Dashboard) | 5 tasks (T9-T13) |
| Story 3 (Persistence/Export) | 2 tasks (T14-T15) |
| Polish/Edge cases | 3 tasks (T16-T18) |
| Parallel opportunities | 3 |
