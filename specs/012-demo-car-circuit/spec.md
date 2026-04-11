# Feature Specification: Car on Circuit Demo

**Feature Branch**: `012-demo-car-circuit`  
**Created**: 2026-04-11  
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - "It Learned to Drive" (Priority: P1)

A developer opens the demo. They see a low-poly 3D car on an oval circuit — clean asphalt, track markings, barriers. They click "Train". The car starts zigzagging, hitting walls, going off track constantly. Episodes are short — the car crashes quickly. After 2-3 minutes of training, the car starts following the curves. After 5 minutes, it smoothly drives around the circuit, completing full laps without leaving the track. They switch to "Inference" — the car drives a perfect lap, every time. The reward chart shows steady improvement. The developer shares the URL.

**Why this priority**: A car driving a circuit is universally understood. Everyone has played a racing game. When the car goes from random crashing to smooth driving, the "aha moment" is instant and shareable.

**Independent Test**: Open demo → Train for 5 minutes → switch to Inference → car completes 3 laps without going off track.

**Acceptance Scenarios**:

1. **Given** the demo loads, **Then** a 3D car sits on an oval circuit track with visible boundaries
2. **Given** the user clicks "Train", **Then** the car moves on the track, initially zigzagging and going off track frequently
3. **Given** training for 500+ episodes, **When** the user switches to "Inference", **Then** the car smoothly follows the circuit and completes full laps
4. **Given** the car goes off track during training, **Then** the episode ends, the car resets to the start, and a new episode begins
5. **Given** the car completes 3 laps, **Then** the episode ends with a high reward

---

### User Story 2 - Code + Chart + Controls (Priority: P2)

Same proven UI pattern: code panel showing the TrainingEnv implementation (~15 lines), live reward chart (reward per episode trending up), and Train/Inference/Stop/Reset + DQN/PPO dropdown.

**Acceptance Scenarios**:

1. **Given** the demo, **Then** the code panel shows a `CircuitEnv implements TrainingEnv` with observe/step/reward/done/reset
2. **Given** training, **Then** the reward chart shows episodes getting longer (more steps before crash) and higher reward
3. **Given** the camera, **Then** it follows the car from behind/above, showing the track ahead

---

### User Story 3 - Shareable (Priority: P3)

The demo is a standalone page deployable on Vercel. Anyone with the URL can watch and interact. No install.

**Acceptance Scenarios**:

1. **Given** the deployed URL, **Then** the demo loads within 3 seconds and is fully interactive

---

### Edge Cases

- What if the car gets stuck in a corner? Episode timeout (200 steps) resets it.
- What if the 3D model fails to load? Use a fallback box geometry (like the CartPole 3D cart).
- What about mobile? Desktop primary. On mobile, the 3D scene renders but controls may be cramped.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The demo MUST display a 3D oval circuit track with visible road surface, edges, and boundaries
- **FR-002**: A 3D car model MUST be visible on the track and move according to the physics simulation
- **FR-003**: The car MUST move at constant forward speed; the agent controls only steering (3 discrete actions: left, straight, right)
- **FR-004**: The observation MUST include: car position relative to track center, car angle relative to track direction, distance to left track edge, distance to right track edge, car forward speed
- **FR-005**: The reward MUST be +1 per step on track, -10 for going off track, +50 bonus per completed lap
- **FR-006**: An episode MUST end when: car goes off track, or car completes 3 laps, or 500 steps elapsed
- **FR-007**: The camera MUST follow the car (third-person chase view)
- **FR-008**: The demo MUST include code panel, reward chart, and Train/Inference/Stop/Reset + algo controls
- **FR-009**: The visual mode indicator MUST be present (training vs inference)
- **FR-010**: The car MUST reset to the start line at the beginning of each episode

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After 5 minutes of training, the car consistently stays on track for a full lap in inference mode
- **SC-002**: The reward chart shows clear upward trend over 500 episodes
- **SC-003**: A first-time visitor understands "the car is learning to drive" within 5 seconds
- **SC-004**: The demo runs at 60fps on a mid-range desktop

## Assumptions

- The circuit is an oval (simple geometry — two straights + two curves). Not a complex Nürburgring.
- The car model is a free low-poly .glb (Kenney assets or Poly Pizza). If unavailable at build time, a rounded box with "wheels" (cylinders) works.
- Physics is custom (not Rapier) — position + angle updated by steering input, constant speed. Similar approach to CartPoleEnv.
- Track is defined as a centerline path + width. "On track" = car center within track width of centerline.
- DQN with default hyperparameters should converge within 500-1000 episodes on this problem.
- The observation space is normalized to [-1, 1] for each dimension.
