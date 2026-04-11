# Feature Specification: Environment Auto-Configuration

**Feature Branch**: `004-env-auto-config`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User description: "Refactor IgnitionEnv API so the environment auto-creates and auto-configures the agent"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Zero-Config Agent Training (Priority: P1)

A creative developer building a Three.js game wants to train an RL agent to control their character. They define their game logic (what the agent sees, what it can do, what's good/bad, when it's over) and call `train()`. The framework figures out the network architecture and hyperparameters automatically. The developer never touches `inputSize`, `hiddenLayers`, `epsilon`, or `batchSize`.

**Why this priority**: This is the core value proposition of IgnitionAI. If a developer has to manually configure neural network parameters, they'll use Python ML-Agents instead. Zero-config is what makes IgnitionAI accessible to creative devs who aren't ML experts.

**Independent Test**: A developer can go from zero to a training agent in under 10 lines of code, with no knowledge of RL hyperparameters.

**Acceptance Scenarios**:

1. **Given** an environment with `getObservation` returning 4 values and `actions` listing 3 actions, **When** the developer calls `env.train()`, **Then** the framework creates a DQN agent with `inputSize=4`, `actionSize=3`, and sensible default hyperparameters, and training begins immediately
2. **Given** an environment already training, **When** the developer calls `env.stop()`, **Then** training stops and the current agent state is preserved
3. **Given** a stopped environment, **When** the developer calls `env.train()` again, **Then** training resumes with the existing agent (not a new one)
4. **Given** an environment with no algorithm specified, **When** the developer calls `env.train()`, **Then** DQN is used as the default algorithm

---

### User Story 2 - Algorithm Selection (Priority: P2)

A developer wants to try PPO instead of DQN on their environment to see if it converges faster. They change one argument: `env.train('ppo')`. The framework reconfigures everything — same environment, different algorithm, correct defaults for PPO.

**Why this priority**: Algorithm comparison is the second most common workflow after initial training. Making it a one-word change removes friction and encourages experimentation.

**Independent Test**: Switching from `env.train('dqn')` to `env.train('ppo')` produces a working PPO agent with appropriate defaults, without any other code changes.

**Acceptance Scenarios**:

1. **Given** an environment, **When** the developer calls `env.train('ppo')`, **Then** a PPO agent is created with defaults appropriate for PPO (actor-critic architecture, GAE-lambda, clip ratio)
2. **Given** an environment, **When** the developer calls `env.train('qtable')`, **Then** a Q-Table agent is created with defaults appropriate for tabular learning (learning rate, epsilon, discretization bins)
3. **Given** an environment previously trained with DQN, **When** the developer calls `env.train('ppo')`, **Then** the DQN agent is disposed and a new PPO agent is created

---

### User Story 3 - Advanced Override (Priority: P3)

An experienced developer wants to use the auto-configuration but override specific hyperparameters they know matter for their problem (e.g., higher learning rate, bigger network). They pass partial overrides and the framework merges them with the defaults.

**Why this priority**: Power users need an escape hatch. But it must be optional — the defaults should work for 80% of use cases without any overrides.

**Independent Test**: A developer can override `lr` and `hiddenLayers` while letting all other parameters use defaults.

**Acceptance Scenarios**:

1. **Given** an environment, **When** the developer calls `env.train('dqn', { lr: 0.01, hiddenLayers: [128, 128] })`, **Then** the agent uses `lr=0.01` and `hiddenLayers=[128, 128]` but all other parameters (epsilon, gamma, batchSize, etc.) use sensible defaults
2. **Given** an environment, **When** the developer passes an invalid override (e.g., `epsilon: 5`), **Then** the framework throws a clear error message explaining the valid range

---

### Edge Cases

- What happens if `getObservation()` returns different-length arrays across calls?
  - Use the length from the first call. If subsequent calls return a different length, log a warning but continue.
- What happens if `actions` is empty?
  - Throw an error: "At least one action must be defined."
- What happens if `train()` is called while already training?
  - Ignore the call (idempotent). Log: "Already training."
- What happens if the developer wants to access the underlying agent?
  - Expose `env.agent` as a read-only property after `train()` is called. Returns `null` before training starts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The environment MUST deduce `inputSize` from the length of the array returned by the first call to `getObservation()`
- **FR-002**: The environment MUST deduce `actionSize` from the number of items in the `actions` array provided by the developer
- **FR-003**: The environment MUST create an agent of the requested type (`'dqn'`, `'ppo'`, `'qtable'`) with sensible defaults when `train()` is called
- **FR-004**: The environment MUST use DQN as the default algorithm when `train()` is called without arguments
- **FR-005**: The environment MUST allow partial hyperparameter overrides via a second argument to `train()`
- **FR-006**: The environment MUST validate overrides and throw clear errors for invalid values
- **FR-007**: The environment MUST expose the created agent via a read-only `agent` property
- **FR-008**: The environment MUST support `stop()` to pause training and `train()` to resume
- **FR-009**: The environment MUST dispose the previous agent when switching algorithms
- **FR-010**: The `actions` property MUST support both a simple count (number) and a named list (string array)
- **FR-011**: The existing callback-based API (`getObservation`, `applyAction`, `computeReward`, `isTerminated`, `onReset`) MUST remain unchanged

### Key Entities

- **IgnitionEnv**: The central object. Holds environment callbacks + agent lifecycle. New: auto-creates agent on `train()`.
- **AlgorithmDefaults**: A mapping of algorithm name → default hyperparameters. Encodes sensible defaults for DQN, PPO, Q-Table.
- **AgentConfig**: The merged config (defaults + overrides + deduced sizes) passed to the agent constructor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can train an RL agent with under 10 lines of code (env definition + `train()` call), with no ML-specific configuration
- **SC-002**: Switching algorithms requires changing exactly 1 argument (the algorithm name)
- **SC-003**: All three algorithms (DQN, PPO, Q-Table) produce converging agents on a simple test environment (GridWorld) using only auto-configured defaults
- **SC-004**: Existing code using the current explicit-agent API continues to work without modification (backwards compatible)
- **SC-005**: Auto-configured agents perform within 20% of hand-tuned agents on standard benchmarks (GridWorld, CartPole)

## Assumptions

- DQN is the best default for most discrete-action environments due to its off-policy nature and replay buffer efficiency
- Sensible defaults exist for each algorithm that work across a wide range of simple environments (these may need tuning for complex problems)
- The `actions` parameter replaces the need for the developer to specify `actionSize` manually
- Backwards compatibility with the current API (explicit agent creation) is required — the new API is additive, not a replacement
- The `train()` method handles the training loop internally (calling `step()` repeatedly) — the developer does not need to call `step()` manually unless they want fine-grained control
