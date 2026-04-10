# Feature Specification: Visualization & Developer Experience

**Feature Branch**: `002-visualization-dx`  
**Created**: 2026-04-10  
**Status**: Draft  
**Input**: User description: "Phase 5 completion — integrate Network Designer to drive agent creation, and build a web-based training dashboard for comparing runs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Network Architecture Builder (Priority: P1)

A creative developer building a Three.js game wants to experiment with different neural network architectures for their RL agent without writing code. They open the Network Designer panel, drag a "Dense 128" node between existing layers, connect it, and click "Apply". The agent is immediately recreated with the new architecture and training restarts. They iterate rapidly: try 3 layers, then 2, change sizes — all visually.

**Why this priority**: This is the core differentiator of IgnitionAI vs Python RL frameworks. Creative JS devs are visual thinkers. Letting them design network architecture via drag-and-drop removes the biggest friction point: "what hiddenLayers should I use?"

**Independent Test**: Can be fully tested by opening the demo, dragging nodes to create a [64, 128, 64] architecture, clicking Apply, and verifying the DQN agent is recreated with those exact hidden layers. Training should start and converge.

**Acceptance Scenarios**:

1. **Given** the Network Designer is open with default [24, 24] layers, **When** the user adds a Dense node with 128 units between them, **Then** the visual graph shows 3 hidden layers and the config panel reflects `hiddenLayers: [24, 128, 24]`
2. **Given** a modified architecture in the Network Designer, **When** the user clicks "Apply", **Then** the agent is disposed, a new agent is created with the visual architecture, and training can begin
3. **Given** a running training session, **When** the user modifies the architecture and applies, **Then** training stops, the agent is recreated, and training restarts from scratch with a clear notification
4. **Given** the Network Designer, **When** the user removes a hidden layer node, **Then** the graph reconnects remaining layers automatically and the config updates

---

### User Story 2 - Training Dashboard with Run Comparison (Priority: P2)

A developer is tuning hyperparameters for a PPO agent in a navigation task. They launch a run with `lr=0.001`, let it train for 200 episodes, then start a second run with `lr=0.0003`. The dashboard shows both runs' reward curves overlaid on the same chart. They can see at a glance that the second learning rate converges faster. They name each run, and can reload them later.

**Why this priority**: Hyperparameter tuning is the most time-consuming part of RL. Without run comparison, developers restart training, lose the previous curve, and can't objectively compare. This is the TensorBoard-equivalent that JS developers don't have today.

**Independent Test**: Can be fully tested by starting two training runs with different hyperparameters, verifying both appear in the run list, and checking that their reward curves are displayed on the same chart with distinguishable colors/labels.

**Acceptance Scenarios**:

1. **Given** the training dashboard, **When** a training session starts, **Then** a new run entry appears with auto-generated name, timestamp, hyperparameters, and live-updating charts
2. **Given** two completed runs, **When** the user selects both in the run list, **Then** their reward, loss, and epsilon curves are overlaid on the same chart with distinct colors and a legend
3. **Given** a completed run, **When** the user names it "PPO lr=0.001 baseline", **Then** the name persists across page reloads (stored in localStorage)
4. **Given** the run list, **When** the user deletes a run, **Then** it is removed from the list and its data is purged from storage

---

### User Story 3 - Run Persistence and Export (Priority: P3)

A developer trained a promising agent yesterday. Today they open the dashboard and see their previous runs listed with full metrics. They select the best run and export its data as JSON for use in a report or external analysis tool.

**Why this priority**: Without persistence, every page reload loses training history. This completes the DX loop: train, compare, keep the good ones, export results.

**Independent Test**: Can be tested by completing a training run, closing and reopening the browser tab, and verifying the run data (metrics, config, curves) is fully restored.

**Acceptance Scenarios**:

1. **Given** completed training runs stored in localStorage, **When** the user reopens the page, **Then** all previous runs appear in the dashboard with full metric history
2. **Given** a selected run, **When** the user clicks "Export JSON", **Then** a file is downloaded containing the run config, per-episode metrics, and final model performance
3. **Given** multiple runs, **When** the user sorts by final reward, **Then** runs are reordered by their last-episode average reward descending

---

### Edge Cases

- What happens when the user creates an architecture with zero hidden layers (input directly to output)?
  - System should allow it — it's a valid linear model. Show a warning: "No hidden layers — agent has no nonlinear capacity."
- What happens when localStorage is full?
  - Gracefully degrade: warn the user, offer to delete old runs, continue training without persistence.
- What happens when the user applies an architecture change mid-training?
  - Stop training, dispose old agent, create new agent, show notification "Agent recreated — training reset."
- What happens with very large run histories (100+ runs)?
  - Paginate the run list. Limit chart overlay to 5 runs maximum for readability.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Network Designer MUST allow adding Dense layer nodes via drag-and-drop onto the canvas
- **FR-002**: Network Designer MUST allow removing layer nodes and auto-reconnecting the graph
- **FR-003**: Network Designer MUST allow editing the unit count of each Dense node (click to edit)
- **FR-004**: Network Designer MUST sync bidirectionally with the config panel — changes in either propagate to the other
- **FR-005**: "Apply" button MUST dispose the current agent and create a new one with the architecture defined by the Network Designer
- **FR-006**: Dashboard MUST record per-episode metrics (reward, loss, epsilon, step count) for each training run
- **FR-007**: Dashboard MUST display run metrics as time-series charts (Recharts line charts)
- **FR-008**: Dashboard MUST support overlaying up to 5 selected runs on the same chart
- **FR-009**: Dashboard MUST persist runs to localStorage with a unique ID, name, timestamp, config, and metric arrays
- **FR-010**: Dashboard MUST allow renaming, deleting, and exporting runs as JSON
- **FR-011**: Dashboard MUST restore all persisted runs on page load

### Key Entities

- **NetworkGraph**: Visual representation of the neural network architecture (nodes, edges). Maps to `hiddenLayers: number[]` in agent config.
- **TrainingRun**: A recorded training session — unique ID, name, agent config snapshot, per-episode metrics array, start/end timestamps.
- **RunMetrics**: Per-episode data point — episode number, total reward, loss, epsilon, step count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from opening the demo to training an agent with a custom 3-layer architecture in under 60 seconds, using only drag-and-drop (no code)
- **SC-002**: Two training runs with different hyperparameters can be visually compared on the same chart within 3 clicks
- **SC-003**: Training run data survives a full page reload with zero data loss
- **SC-004**: The Network Designer and config panel stay in sync — changing one always reflects in the other within the same render cycle

## Assumptions

- The existing React Flow integration in the demo provides sufficient primitives (custom nodes, edges, event handlers) — no need to replace it
- Recharts can handle overlaying 5 line series with ~1000 data points each without performance issues
- localStorage provides sufficient storage for typical usage (< 100 runs with ~500 episodes each)
- The demo app (`packages/demo-target-chasing`) is the target for both features; no new package is needed
- All agents support `dispose()` and can be safely recreated mid-session
