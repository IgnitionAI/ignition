# Feature Specification: Formal Environment Interfaces

**Feature Branch**: `008-env-interface`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User description: "Force formal TrainingEnv and InferenceEnv interfaces — kill callbacks API"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Training with a Structured Environment (Priority: P1)

A developer wants to train an RL agent in their game. Instead of passing loose callback functions, they implement a formal contract: a class with `observe()`, `step()`, `reward()`, `done()`, `reset()`, and `actions`. The framework validates at construction time that all required methods exist. If the developer forgets `reset()`, they get an immediate, clear error — not a silent bug 200 episodes later.

**Why this priority**: This is the core API change. Every user of IgnitionAI will go through this path. The contract must be clear, enforceable, and intuitive.

**Independent Test**: Implement a class with the 5 required methods + actions property → pass it to IgnitionEnv → training works. Remove one method → construction fails with a clear error.

**Acceptance Scenarios**:

1. **Given** a class implementing all required methods (observe, step, reward, done, reset) and an actions property, **When** the developer passes it to the framework, **Then** training starts successfully
2. **Given** a class missing the `reward()` method, **When** the developer passes it to the framework, **Then** the framework throws an error: "Environment must implement reward()"
3. **Given** a class with `actions: ['left', 'right', 'jump']`, **When** training starts, **Then** the agent is auto-configured with `actionSize=3`
4. **Given** a class with `actions: 4` (number), **When** training starts, **Then** the agent is auto-configured with `actionSize=4`
5. **Given** a valid environment, **When** the developer calls `train()`, **Then** the framework deduces `inputSize` from the first `observe()` call, creates the agent, and begins the training loop

---

### User Story 2 - Inference with a Minimal Environment (Priority: P2)

A developer has a trained model (ONNX) and wants to deploy it in production — their live game, an interactive installation, a demo. They only need the agent to observe and act — no reward, no episode management, no training. They implement a minimal contract with just `observe()` and `step()`, load the ONNX model, and the agent makes decisions in real time.

**Why this priority**: The training-to-production pipeline is IgnitionAI's differentiator. If deploying a trained model requires the same heavy interface as training, the DX is broken.

**Independent Test**: Implement a class with only observe() and step() → pass it with an ONNX model path → agent produces actions without training infrastructure.

**Acceptance Scenarios**:

1. **Given** a class implementing observe() and step(), **When** the developer passes it to the inference framework with a model, **Then** the agent runs inference: observe → getAction → step, in a loop
2. **Given** an inference environment, **When** the developer tries to call train(), **Then** the framework throws an error: "Inference environments cannot be trained"
3. **Given** an inference environment, **Then** no reward function, no done function, no reset function is required

---

### User Story 3 - Migrating Existing Demos (Priority: P3)

The three existing demos (GridWorld, CartPole, MountainCar) already have env classes (`GridWorldEnv`, `CartPoleEnv`, `MountainCarEnv`) with the right methods. They need to formally implement the new interface and the demo App.tsx files need to pass the env object instead of wiring callbacks.

**Why this priority**: Proves the new API works on real code and validates backwards-compatible migration path.

**Independent Test**: All three demos run identically after migration. All existing tests pass.

**Acceptance Scenarios**:

1. **Given** the existing `GridWorldEnv` class, **When** it formally implements the training interface, **Then** the demo works exactly as before with zero behavior change
2. **Given** all three demos migrated, **When** the full test suite runs, **Then** all tests pass with zero regressions

---

### Edge Cases

- What if `observe()` returns different-length arrays? Use length from first call. Log a warning on mismatch.
- What if `actions` is an empty array? Throw: "At least one action must be defined."
- What if a developer passes a plain object instead of a class instance? Accept it — duck typing. If it has the right methods, it works.
- What if step() is async? The interface accepts both sync and async step implementations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The framework MUST define a training environment contract requiring: observe(), step(action), reward(), done(), reset(), and actions property
- **FR-002**: The framework MUST define an inference environment contract requiring only: observe() and step(action)
- **FR-003**: The framework MUST validate at construction time that all required methods exist on the environment object
- **FR-004**: The framework MUST throw clear, actionable error messages when methods are missing (naming the specific missing method)
- **FR-005**: The framework MUST accept both class instances and plain objects that satisfy the contract (duck typing)
- **FR-006**: The framework MUST deduce `inputSize` from the first observe() call and `actionSize` from the actions property
- **FR-007**: The old callback-based API MUST be removed entirely — no backwards compatibility
- **FR-008**: The training framework MUST accept: `new IgnitionEnv(envObject)` followed by `env.train(algorithm?, overrides?)`
- **FR-009**: The inference framework MUST accept: `new IgnitionInferenceEnv(envObject, model)` followed by `env.run()` or `env.step()`
- **FR-010**: All existing demo environments (GridWorld, CartPole, MountainCar) MUST be migrated to formally implement the training interface
- **FR-011**: All existing tests MUST pass after migration with zero regressions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can create a training environment by implementing exactly 5 methods + 1 property — no more, no less
- **SC-002**: A developer can create an inference environment by implementing exactly 2 methods — no more, no less
- **SC-003**: Missing methods produce an error within 1 second of construction (not after training begins)
- **SC-004**: All 3 demos work identically after migration — same visual behavior, same convergence
- **SC-005**: The full test suite passes with zero regressions after the API change

## Assumptions

- Duck typing is preferred over `instanceof` checks — a plain object with the right methods is valid
- This is a breaking change — the old callback API is removed, not deprecated
- The `actions` property on the environment replaces the old `actions` field in the config
- `InferenceEnv` will be used with `@ignitionai/backend-onnx` (OnnxAgent) but the interface itself lives in `@ignitionai/core`
- The `train()` method on IgnitionEnv stays the same — only the constructor input changes
