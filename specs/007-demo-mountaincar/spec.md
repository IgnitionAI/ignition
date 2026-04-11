# Feature Specification: MountainCar Demo

**Feature Branch**: `007-demo-mountaincar`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User description: "MountainCar 2D demo — car stuck in a valley must build momentum to reach the flag"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - "The Aha Moment" (Priority: P1)

A developer opens the demo. They see a valley (curved landscape) with a small car at the bottom and a flag at the top of the right hill. They click "Start". The car pushes randomly — sometimes left, sometimes right — but never reaches the flag. It keeps rolling back to the bottom. After a few minutes of training, something clicks: the car starts swinging — left, then right, left, then right — building momentum like a pendulum. Eventually it swings high enough to crest the hill and reach the flag. The reward chart shows episodes getting shorter. The developer thinks: "It figured out it needs to go backwards first. That's not obvious."

**Why this priority**: MountainCar demonstrates **exploration** — the agent must discover a counterintuitive strategy (go left first to build momentum) that a human wouldn't think of immediately. This is the "wow, it's actually thinking" moment.

**Independent Test**: Open page, click Start, wait 3-5 minutes. The car starts reaching the flag consistently. Episodes get shorter on the chart.

**Acceptance Scenarios**:

1. **Given** the demo loads, **When** the user clicks "Start", **Then** the car begins moving on the valley and the reward chart starts updating
2. **Given** training has run for 500+ episodes, **When** the user watches the canvas, **Then** the car consistently reaches the flag using a swinging strategy
3. **Given** training is running, **When** the user clicks "Stop", **Then** the car freezes and the chart stops
4. **Given** the user clicks "Reset", **Then** the agent is disposed, chart clears, fresh agent created

---

### User Story 2 - Code Showcase (Priority: P2)

The code panel shows ~12 lines: observation = [position, velocity], 3 actions (push left, none, push right), reward = -1 per step. The developer sees that even a sparse reward problem is simple to set up.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** the developer reads the code panel, **Then** they see valid IgnitionAI code with observation, actions, reward, and termination logic

---

### User Story 3 - Algorithm Comparison (Priority: P3)

The developer switches between DQN and PPO. DQN with epsilon-greedy explores the momentum strategy via random actions. PPO uses entropy bonus for exploration.

**Acceptance Scenarios**:

1. **Given** the dropdown, **When** the user selects "PPO" and resets, **Then** a PPO agent trains on the same environment

---

### Edge Cases

- What if the car never reaches the flag in an episode? Episode terminates after 200 steps. Reward = -200 (very bad). Agent learns to try harder next time.
- What if the car overshoots past the flag? Position > 0.5 = goal reached. The flag position is the termination boundary.
- Sparse reward makes this harder than CartPole — the agent gets -1 every step and only "wins" by reaching the flag faster. Exploration is critical.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The demo MUST display a 2D canvas showing a valley landscape (curved hill shape) with a car that slides along it
- **FR-002**: A flag MUST be visible at the top of the right hill (position = 0.5)
- **FR-003**: The car position MUST follow the valley curve: height = sin(3 * position) shape
- **FR-004**: The agent observation MUST be [position, velocity] (2 values, normalized)
- **FR-005**: The agent MUST have 3 actions: push left, no action, push right
- **FR-006**: The reward MUST be -1 for each timestep (sparse — no shaping)
- **FR-007**: An episode MUST terminate when: car reaches goal (position >= 0.5) or 200 steps elapsed
- **FR-008**: A reward chart MUST update in real time showing per-episode total reward (higher = fewer steps = better)
- **FR-009**: The code panel MUST display the IgnitionAI code powering the demo
- **FR-010**: Start, Stop, Reset buttons and algorithm dropdown (DQN, PPO) MUST control training

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The car visibly uses a swinging/momentum strategy after training (not just pushing right)
- **SC-002**: The reward curve trends upward (less negative) over 500 episodes, indicating shorter episodes
- **SC-003**: The code panel contains 15 or fewer lines
- **SC-004**: The demo loads and is interactive within 2 seconds

## Assumptions

- Standard MountainCar physics: position in [-1.2, 0.6], velocity in [-0.07, 0.07], force = 0.001, gravity = 0.0025
- Starting position: random in [-0.6, -0.4] (bottom of valley)
- DQN convergence may take 500-1000 episodes due to sparse reward — this is expected and part of the demo's educational value
- DQN with slightly higher epsilon (1.0) and slower decay (0.998) helps exploration on this problem
- Same layout pattern as GridWorld and CartPole demos
