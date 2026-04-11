# Feature Specification: CartPole 3D Hero Demo

**Feature Branch**: `011-demo-cartpole-3d`  
**Created**: 2026-04-11  
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The Wow Moment (Priority: P1)

A developer lands on the IgnitionAI homepage. They see a polished 3D scene: a metallic cart on a sleek rail, a pole balancing on top, soft lighting, subtle shadows. The scene is alive — the pole wobbles, the cart slides. They click "Train". The pole falls repeatedly at first. After a minute, it starts staying up longer. After two minutes, the pole is perfectly balanced — the cart makes tiny corrections, the pole barely moves. The 3D quality makes it feel like a real physics simulation. The developer thinks: "This runs in my browser. This is JavaScript. I want to use this."

**Why this priority**: This is the landing page hero. First impressions decide adoption. A polished 3D demo communicates "professional framework", not "student project".

**Independent Test**: Open the deployed URL → scene renders in under 2 seconds → click Train → pole balances after 2 minutes → switch to Inference → pole stays perfectly still.

**Acceptance Scenarios**:

1. **Given** the page loads, **Then** a 3D scene renders with cart, pole, rail, lighting, and shadows — no visual glitches
2. **Given** the user clicks "Train", **Then** the cart and pole animate in real time matching the physics simulation
3. **Given** training for 200+ episodes, **When** the user switches to "Inference", **Then** the pole remains balanced with minimal wobble in 3D
4. **Given** the scene is running, **Then** the camera orbits smoothly around the cart (auto-orbit or user-controlled)
5. **Given** the demo, **Then** it runs at 60fps on a modern desktop browser

---

### User Story 2 - Code + Chart (Priority: P2)

Below or beside the 3D scene, the developer sees the same proven pattern: code panel (10 lines), reward chart (episode length trending up), and controls (Train/Inference/Stop/Reset + DQN/PPO dropdown).

**Acceptance Scenarios**:

1. **Given** the page, **Then** the code panel shows ~12 lines of IgnitionAI code using `CartPoleEnv` and `env.train()`
2. **Given** training is running, **Then** the reward chart updates live showing episode length increasing
3. **Given** the controls, **Then** Train/Inference/Stop/Reset buttons and DQN/PPO dropdown work identically to the 2D demo

---

### User Story 3 - Deployable (Priority: P3)

The demo is deployed as a standalone page with a shareable URL. Anyone can open it, no install needed. It's the link the developer shares on Twitter, LinkedIn, or in a README.

**Acceptance Scenarios**:

1. **Given** the deployed URL, **When** anyone opens it in Chrome/Firefox/Safari, **Then** the demo loads and is interactive within 3 seconds
2. **Given** the URL is shared, **Then** no authentication, no install, no setup is required — it just works

---

### Edge Cases

- What if the user's device doesn't support WebGL2? Show a fallback message: "Your browser doesn't support WebGL2. Try Chrome or Firefox."
- What if the 3D scene tanks performance? The physics simulation (CartPoleEnv) runs independently of rendering — if FPS drops, training still works, just the visual is laggy.
- Mobile? Nice-to-have but not required. Desktop is the primary target.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The demo MUST render a 3D scene with a cart (box/rounded shape), a pole (cylinder), and a rail (line/track)
- **FR-002**: The 3D scene MUST have professional lighting: ambient + directional light with shadows
- **FR-003**: The cart MUST slide left/right on the rail matching the physics simulation
- **FR-004**: The pole MUST rotate on the cart's pivot point matching the physics angle
- **FR-005**: The camera MUST auto-orbit slowly or respond to user drag for viewing angle
- **FR-006**: The physics MUST use the same `CartPoleEnv` from `@ignitionai/environments` (Euler integration, not Rapier)
- **FR-007**: The 3D rendering MUST be decoupled from the training loop — rendering at display FPS, training at its own pace
- **FR-008**: The demo MUST include code panel, reward chart, and Train/Inference/Stop/Reset + algo dropdown
- **FR-009**: The visual mode indicator MUST be present: green glow = training, blue glow = inference
- **FR-010**: The demo MUST be deployable as a static site

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The 3D scene loads and is interactive within 3 seconds on a standard desktop browser
- **SC-002**: The demo runs at 60fps during both training and inference on a mid-range laptop
- **SC-003**: After 2 minutes of training, the pole stays balanced for 400+ steps in inference mode
- **SC-004**: A first-time visitor understands "this is an AI learning to balance a pole" within 5 seconds

## Assumptions

- The physics engine is `CartPoleEnv` (Euler integration) — NOT Rapier. R3F + Rapier is for rendering only. The RL agent controls the physics, not the physics engine.
- Actually: Rapier is NOT used for physics. The 3D scene just renders the state from `CartPoleEnv`. R3F renders, CartPoleEnv simulates.
- The cart and pole are simple 3D meshes — no complex models or textures needed. Clean geometric shapes with good materials.
- `@react-three/drei` provides OrbitControls, Environment, and other helpers.
- The demo reuses `CartPoleEnv` from `@ignitionai/environments` — same physics as the 2D demo, different renderer.
