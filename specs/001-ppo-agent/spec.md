# Feature Specification: PPO Agent Implementation

**Feature Branch**: `001-ppo-agent`
**Created**: 2026-04-09
**Status**: Draft
**Input**: Implement a complete PPO (Proximal Policy Optimization) agent in @ignitionai/backend-tfjs

## User Scenarios & Testing

### User Story 1 - Create and train a PPO agent on a simple task (Priority: P1)

A developer creates a PPO agent with default config, plugs it into IgnitionEnv, and runs a training loop. The agent learns to solve a basic task (e.g., move toward a target) using policy gradient optimization.

**Why this priority**: This is the core value proposition. Without a working PPO agent that trains, nothing else matters.

**Independent Test**: Can be fully tested by creating a PPOAgent, feeding it experiences from a deterministic environment, calling train(), and verifying the loss decreases and actions improve over episodes.

**Acceptance Scenarios**:

1. **Given** a PPOAgent with default config (inputSize=4, actionSize=2), **When** the agent collects 128 steps of experience and calls train(), **Then** the policy loss, value loss, and entropy are computed without NaN and tensors are properly disposed.
2. **Given** a PPOAgent integrated with IgnitionEnv, **When** training runs for 100+ episodes on a simple binary task (state[0] > 0.5 => action 1), **Then** the agent achieves >60% correct action rate.
3. **Given** a PPOAgent, **When** getAction() is called with an observation, **Then** it returns a valid action index sampled from the policy distribution.

---

### User Story 2 - Configure PPO hyperparameters (Priority: P2)

A developer customizes the PPO agent's hyperparameters (clip ratio, GAE lambda, entropy coefficient, learning rate, rollout length, etc.) to tune performance for their specific environment.

**Why this priority**: Different environments need different tuning. Configurability is essential for practical use.

**Independent Test**: Can be tested by creating PPOAgents with different configs and verifying the config values are reflected in training behavior (e.g., higher entropy coeff = more exploration).

**Acceptance Scenarios**:

1. **Given** a PPOConfig with custom values (clipRatio=0.1, gaeLambda=0.9), **When** a PPOAgent is created, **Then** training uses those exact values.
2. **Given** a PPOConfig with only inputSize and actionSize, **When** a PPOAgent is created, **Then** all other parameters use sensible defaults.

---

### User Story 3 - Save and load PPO models (Priority: P3)

A developer saves a trained PPO agent's weights and loads them later to resume training or run inference.

**Why this priority**: Model persistence enables practical workflows but is not required for initial training.

**Independent Test**: Can be tested by training a PPOAgent, saving it, loading into a new instance, and verifying identical action outputs for the same observations.

**Acceptance Scenarios**:

1. **Given** a trained PPOAgent, **When** save() is called and a new PPOAgent calls load() with the same path, **Then** both agents produce identical action probabilities for the same input.

---

### Edge Cases

- What happens when the rollout buffer is not full (fewer steps than nSteps)? Agent should still train on available data.
- How does the agent handle observations with NaN or Infinity? Throw a clear error before feeding to the network.
- What happens when all action probabilities collapse to one action? Entropy bonus should prevent this; if entropy reaches near-zero, log a warning.
- What happens if train() is called before any experiences are collected? No-op, return without error.

## Requirements

### Functional Requirements

- **FR-001**: PPOAgent MUST implement the AgentInterface contract (getAction, remember, train) from @ignitionai/core.
- **FR-002**: PPOAgent MUST use an Actor-Critic architecture with a shared trunk and two output heads (policy logits + state value).
- **FR-003**: PPOAgent MUST collect experiences into a rollout buffer of configurable size (nSteps) before training.
- **FR-004**: PPOAgent MUST compute advantages using Generalized Advantage Estimation (GAE) with configurable gamma and lambda.
- **FR-005**: PPOAgent MUST use the PPO clipped surrogate objective for the policy loss with configurable clip ratio.
- **FR-006**: PPOAgent MUST compute a value function loss (MSE between predicted and actual returns).
- **FR-007**: PPOAgent MUST include an entropy bonus in the total loss to encourage exploration.
- **FR-008**: PPOAgent MUST train on mini-batches from the collected rollout for multiple epochs.
- **FR-009**: PPOAgent MUST properly manage TensorFlow.js tensors (tf.tidy, dispose) to prevent memory leaks.
- **FR-010**: PPOAgent MUST be exported from @ignitionai/backend-tfjs index.ts.
- **FR-011**: PPOAgent MUST include comprehensive unit tests following the existing DQN test patterns.

### Key Entities

- **PPOConfig**: Configuration object (inputSize, actionSize, hiddenLayers, clipRatio, gaeLambda, entropyCoeff, valueLossCoeff, lr, nSteps, batchSize, epochs, gamma).
- **RolloutBuffer**: Stores trajectories (states, actions, rewards, values, logProbs, dones) for N steps before training.
- **ActorCriticModel**: Shared trunk MLP with two heads — policy head (softmax over actions) and value head (single scalar).

## Success Criteria

### Measurable Outcomes

- **SC-001**: PPOAgent trains without memory leaks — tensor count before and after training remains stable (no growth over 100 train() calls).
- **SC-002**: PPOAgent achieves >60% accuracy on a simple binary classification RL task within 200 episodes.
- **SC-003**: All unit tests pass with Vitest (`pnpm test`).
- **SC-004**: PPOAgent integrates seamlessly with IgnitionEnv — no changes required to core package.

## Assumptions

- Discrete action spaces only for v1 (continuous action spaces are out of scope).
- The existing AgentInterface (getAction, remember, train) is sufficient — PPO's train() internally decides when to actually update (after nSteps experiences collected).
- TensorFlow.js CPU backend is sufficient for testing; WebGPU/WebGL are nice-to-have but not required for correctness.
- The existing BuildMLP utility can be adapted for the shared trunk architecture, or a new builder function can be created alongside it.
