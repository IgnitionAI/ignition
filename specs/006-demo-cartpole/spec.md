# Feature Specification: CartPole Demo

**Feature Branch**: `006-demo-cartpole`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User description: "CartPole 2D demo — same pattern as demo-gridworld"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - "The Pole Stays Up" (Priority: P1)

A developer opens the demo page. They see a cart on a rail with a pole wobbling on top. They click "Start". At first the pole falls constantly — the agent pushes randomly. After a minute of training, the pole stays balanced for longer and longer. After 2-3 minutes, the pole barely wobbles at all. The reward curve confirms: episode length (= time balanced) increases steadily. The developer thinks: "Classic RL benchmark, running in my browser, 10 lines of code."

**Why this priority**: CartPole is the most universally recognized RL demo. Anyone who has seen an RL talk or course recognizes it instantly. If IgnitionAI can solve CartPole visually in the browser, it has instant credibility.

**Independent Test**: Open page, click Start, wait 3 minutes. Pole stays balanced for 200+ steps. Reward curve trends upward.

**Acceptance Scenarios**:

1. **Given** the demo loads, **When** the user clicks "Start", **Then** the cart and pole animate on the canvas and the reward chart begins updating
2. **Given** training has run for 200+ episodes, **When** the user watches the canvas, **Then** the pole remains upright noticeably longer than in the first 10 episodes
3. **Given** training is running, **When** the user clicks "Stop", **Then** the animation freezes and the chart stops
4. **Given** training is stopped, **When** the user clicks "Start", **Then** training resumes with the existing agent
5. **Given** the user clicks "Reset", **Then** the agent is disposed, the chart clears, and a fresh agent is created

---

### User Story 2 - Code Showcase (Priority: P2)

The code panel shows the ~10 lines that power this demo. The developer reads it and sees the CartPole physics defined as simple observation/action/reward functions — no complex physics engine needed.

**Why this priority**: Demonstrates that continuous-state, physics-based problems are just as easy to set up as GridWorld.

**Independent Test**: Code panel visible, shows valid IgnitionAI code matching the running behavior.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** the developer reads the code panel, **Then** they see ~12 lines defining observation (cart pos, velocity, pole angle, angular velocity), 2 actions (push left/right), and reward (+1 per step balanced)

---

### User Story 3 - Algorithm Comparison (Priority: P3)

The developer switches from DQN to PPO via dropdown to compare convergence speed on CartPole. PPO is expected to solve it faster and more stably.

**Acceptance Scenarios**:

1. **Given** the demo, **When** the user selects "PPO" and clicks Reset, **Then** a PPO agent is created and training begins
2. **Given** the dropdown, **Then** DQN and PPO are available (Q-Table is not suitable for continuous state spaces — omit or disable it)

---

### Edge Cases

- What if the cart goes off screen? The episode terminates (cart position > 2.4 or < -2.4).
- What if the pole angle exceeds the limit? The episode terminates (angle > 12 degrees).
- What if the episode lasts 500 steps? It's considered "solved" — episode ends with maximum reward.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The demo MUST display a 2D canvas showing a cart (rectangle) sliding left/right on a rail, with a pole (line) pivoting on top
- **FR-002**: The physics MUST simulate cart-pole dynamics: cart position, cart velocity, pole angle, pole angular velocity, updated via Euler integration
- **FR-003**: The agent observation MUST be [cart_position, cart_velocity, pole_angle, pole_angular_velocity] (4 values)
- **FR-004**: The agent MUST have 2 actions: push left, push right
- **FR-005**: The reward MUST be +1 for each timestep the pole remains upright
- **FR-006**: An episode MUST terminate when: pole angle > 12 degrees, cart out of bounds (|position| > 2.4), or episode reaches 500 steps
- **FR-007**: A reward chart MUST update in real time showing episode total reward (= episode length)
- **FR-008**: The code panel MUST display the IgnitionAI code powering the demo
- **FR-009**: Start, Stop, Reset buttons and algorithm dropdown (DQN, PPO) MUST control training
- **FR-010**: The canvas MUST animate at a smooth frame rate, showing the cart and pole moving in real time during training

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The pole visibly stays balanced longer after 2 minutes of training compared to the first 10 seconds
- **SC-002**: The reward curve (episode length) trends upward over 200 episodes
- **SC-003**: The code panel contains 15 or fewer lines
- **SC-004**: The demo loads and is interactive within 2 seconds

## Assumptions

- Standard CartPole physics parameters (gravity=9.8, cart mass=1.0, pole mass=0.1, pole length=0.5, force magnitude=10.0, dt=0.02) are sufficient
- DQN with default hyperparameters converges on CartPole within 200-400 episodes
- PPO converges faster (~100-200 episodes) but both work with auto-configured defaults
- Q-Table is not shown in the dropdown since CartPole has continuous state space (4 floats) — tabular methods don't apply
- Same layout pattern as demo-gridworld: 3-column (code | canvas | chart) + controls bottom
