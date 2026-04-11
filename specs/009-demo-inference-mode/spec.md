# Feature Specification: Demo Inference Mode

**Feature Branch**: `009-demo-inference-mode`  
**Created**: 2026-04-11  
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Watch the Trained Agent Play (Priority: P1)

A developer trains a DQN agent on GridWorld for 2 minutes. The reward curve is going up. They click "Inference". Training stops. The agent now plays the game using only what it learned — no exploration, no learning, just pure exploitation. The agent takes the optimal path every time. The canvas border turns blue to signal inference mode. The developer thinks: "It actually learned. The model works."

**Why this priority**: This is the proof that training produced a real, usable model. Without inference mode, the developer never knows if the agent is good because of learning or because of luck/exploration.

**Independent Test**: Train for 100+ episodes → click Inference → agent consistently reaches goal via optimal path. No random moves.

**Acceptance Scenarios**:

1. **Given** a trained agent (100+ episodes), **When** the user clicks "Inference", **Then** the agent runs observe → getAction → step in a loop with no learning and no random exploration
2. **Given** inference mode is active, **When** the user watches the agent, **Then** the agent's behavior is deterministic — same start position produces same path every time
3. **Given** inference mode is active, **When** the user clicks "Training", **Then** the agent resumes training with learning and exploration re-enabled
4. **Given** no training has occurred, **When** the user clicks "Inference", **Then** the agent runs but performs poorly (random-initialized model) — this is expected and educational

---

### User Story 2 - Visual Mode Indicator (Priority: P2)

The developer can instantly tell which mode is active by looking at the canvas border. Green border = training (agent is learning). Blue border = inference (agent is exploiting). No ambiguity.

**Acceptance Scenarios**:

1. **Given** training mode, **Then** the canvas has a green border
2. **Given** inference mode, **Then** the canvas has a blue border
3. **Given** the demo is stopped, **Then** no colored border (neutral/default)

---

### User Story 3 - All Three Demos (Priority: P3)

The inference mode works identically across GridWorld, CartPole, and MountainCar. Same button, same visual indicator, same behavior.

**Acceptance Scenarios**:

1. **Given** GridWorld demo, **When** inference mode, **Then** agent navigates to target without random moves
2. **Given** CartPole demo, **When** inference mode, **Then** pole stays balanced with no wobble
3. **Given** MountainCar demo, **When** inference mode, **Then** car reaches flag using learned momentum strategy

---

### Edge Cases

- What if the user switches to inference before training? Agent runs with random-initialized weights — performs badly. This is fine and educational.
- What if the user toggles rapidly between training and inference? Each toggle is idempotent — no crash, no state corruption.
- Does inference mode reset the episode? No — it continues from current state. The agent just stops learning.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An "Inference" button MUST switch the agent to pure exploitation mode (no learning, no exploration)
- **FR-002**: In inference mode, the agent MUST NOT call remember() or train() — only observe() → getAction() → step()
- **FR-003**: In inference mode, epsilon MUST be 0 (greedy action selection)
- **FR-004**: A "Training" button MUST resume normal training with learning and exploration
- **FR-005**: The canvas border MUST indicate mode: green = training, blue = inference, none = stopped
- **FR-006**: The inference loop MUST run at the same speed as the training loop
- **FR-007**: Inference mode MUST work with all three algorithms (DQN, PPO, Q-Table)
- **FR-008**: All three demos (GridWorld, CartPole, MountainCar) MUST support inference mode

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After 2 minutes of training on GridWorld, inference mode produces a path within 2 steps of optimal (12 steps for a 7x7 grid)
- **SC-002**: Mode switching (Training ↔ Inference) takes under 100ms — instant to the user
- **SC-003**: The visual mode indicator (border color) is visible within the first second of mode change
- **SC-004**: All 3 demos support inference mode with identical UX

## Assumptions

- Inference mode uses the existing trained TF.js model — no ONNX conversion needed for the demo
- For DQN: inference = epsilon forced to 0 (greedy). For PPO: inference = argmax of policy (no sampling). For Q-Table: inference = greedy Q-value lookup.
- The inference loop is a simplified step: observe → getAction → env.step. No experience storage, no training.
- Adding inference mode to IgnitionEnv core (as a method) is preferred over duplicating logic in each demo
