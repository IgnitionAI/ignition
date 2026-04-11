# Feature Specification: GridWorld Demo

**Feature Branch**: `005-demo-gridworld`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User description: "Demo app showcasing IgnitionAI's zero-config API with a 2D GridWorld"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - "Look, It Learns" (Priority: P1)

A developer visits the demo page. They see a 2D grid with a blue agent and a green target. They click "Start". The agent starts moving randomly, bumping into walls. Within 30 seconds, it starts finding shorter paths. Within 2 minutes, it consistently takes the optimal path. The reward curve on the right confirms: it's going up. The developer thinks: "This is 10 lines of code. I can do this in my project."

**Why this priority**: This is the showcase moment. If the agent visibly learns on screen, the framework sells itself. Everything else is secondary.

**Independent Test**: Open the page, click Start, watch for 2 minutes. Agent's path shortens visibly. Reward curve trends upward.

**Acceptance Scenarios**:

1. **Given** the demo page loads, **When** the user clicks "Start", **Then** the agent begins moving on the grid and the reward curve starts updating in real time
2. **Given** training is running for 100+ episodes, **When** the user watches the grid, **Then** the agent's path from start to target is visibly shorter than in the first 10 episodes
3. **Given** training is running, **When** the user clicks "Stop", **Then** the agent freezes and the reward curve stops updating
4. **Given** training was stopped, **When** the user clicks "Start" again, **Then** training resumes from where it left off (not from scratch)
5. **Given** training is running, **When** the user clicks "Reset", **Then** the agent returns to the start position, the reward curve clears, and a new agent is created

---

### User Story 2 - Code Showcase (Priority: P2)

Next to the grid, the developer sees the exact code that powers this demo — 10 lines, syntax highlighted, read-only. They can read it and immediately understand how to use IgnitionAI in their own project. No scrolling, no hidden complexity. The code IS the documentation.

**Why this priority**: The code panel is what converts a viewer into a user. "I can copy this into my project" is the reaction we want.

**Independent Test**: The code panel is visible on page load, shows valid IgnitionAI code, and matches the actual behavior on screen.

**Acceptance Scenarios**:

1. **Given** the demo page loads, **When** the user reads the code panel, **Then** they see ~10 lines of valid IgnitionAI code that creates the environment and calls `env.train()`
2. **Given** the code panel, **When** the user compares the code to the running behavior, **Then** the code accurately describes what's happening (same grid size, same actions, same reward logic)

---

### User Story 3 - Algorithm Comparison (Priority: P3)

The developer wants to see how PPO compares to DQN on this problem. They select "PPO" from the dropdown, click Reset, then Start. They watch the agent learn with PPO. They can switch back to DQN or try Q-Table. Each algorithm uses the same environment, same code — only the algorithm changes.

**Why this priority**: Algorithm comparison is a key differentiator. Showing that switching algorithms is a one-dropdown change reinforces the zero-config promise.

**Independent Test**: Switch from DQN to PPO via dropdown, click Reset + Start. Agent trains with PPO. Switch to Q-Table. Agent trains with Q-Table.

**Acceptance Scenarios**:

1. **Given** the demo page, **When** the user selects "PPO" from the algorithm dropdown and clicks Reset, **Then** a new PPO agent is created and training can begin
2. **Given** training with DQN is running, **When** the user switches to Q-Table and clicks Reset, **Then** the DQN agent is disposed and a Q-Table agent takes over
3. **Given** the algorithm dropdown, **When** the user sees the options, **Then** DQN, PPO, and Q-Table are available

---

### Edge Cases

- What happens if the browser tab is not focused during training?
  - Training continues via setTimeout. The grid and chart update when the tab regains focus.
- What happens on a very small screen (mobile)?
  - The layout stacks vertically. Grid takes priority. Code panel and chart collapse below.
- What happens if the agent never reaches the target in an episode?
  - Episode terminates after a step limit (e.g., 100 steps). Reward reflects the failure. Training continues.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The demo MUST display a 2D grid (minimum 7x7) with a blue agent cell and a green target cell
- **FR-002**: The agent MUST move one cell per step in one of four directions (up, down, left, right)
- **FR-003**: The agent's visited cells MUST show a trail (fading color) so the path is visible
- **FR-004**: A reward curve MUST update in real time, showing per-episode total reward
- **FR-005**: The code panel MUST display the actual IgnitionAI code powering the demo, syntax highlighted, in under 15 lines
- **FR-006**: Start, Stop, and Reset buttons MUST control the training lifecycle
- **FR-007**: An algorithm dropdown MUST allow switching between DQN, PPO, and Q-Table
- **FR-008**: Reset MUST dispose the current agent, clear the reward curve, and create a fresh agent with the selected algorithm
- **FR-009**: The demo MUST work as a standalone page accessible via `pnpm dev`
- **FR-010**: The grid MUST show the current episode number and step count

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor understands what IgnitionAI does within 10 seconds of watching the demo
- **SC-002**: The agent visibly improves its pathfinding within 60 seconds of training (reward curve trending up)
- **SC-003**: The code panel contains 15 or fewer lines of code
- **SC-004**: Switching algorithms takes under 3 seconds (dropdown + Reset + Start)
- **SC-005**: The demo loads and is interactive within 2 seconds on a standard connection

## Assumptions

- A 7x7 GridWorld is sufficient to demonstrate learning without being too slow or too trivial
- DQN with default hyperparameters converges on a 7x7 grid within 100-200 episodes (proven by existing tests)
- The demo is a new standalone package (`packages/demo-gridworld/`), not a modification of the existing `demo-target-chasing`
- Recharts is sufficient for the real-time reward curve (no need for a more complex charting library)
- The code panel shows representative code, not necessarily the exact source — it illustrates the API the user would write
- Mobile responsiveness is nice-to-have, not a blocker for v1
