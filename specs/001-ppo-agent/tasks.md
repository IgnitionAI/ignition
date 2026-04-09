# Tasks: PPO Agent Implementation

**Input**: Design documents from `/specs/001-ppo-agent/`
**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: REQUIRED per Constitution Principle I (TDD — NON-NEGOTIABLE). Tests FIRST, implementation SECOND.

## Phase 1: Setup

**Purpose**: Add PPOConfig type and prepare exports

- [ ] T001 Add PPOConfig interface to `packages/backend-tfjs/src/types.ts`
- [ ] T002 Uncomment PPO export and add new exports in `packages/backend-tfjs/src/index.ts`

---

## Phase 2: Foundational — Model & Buffer

**Purpose**: Build the Actor-Critic network builder and RolloutBuffer that PPOAgent depends on

### Tests FIRST (TDD Red phase)

- [ ] T003 [P] Write RolloutBuffer tests in `packages/backend-tfjs/test/ppo.test.ts` — test add(), isFull(), computeAdvantages(), clear()
- [ ] T004 [P] Write BuildActorCritic tests in `packages/backend-tfjs/test/ppo.test.ts` — test model output shapes (policy: [batch, actionSize], value: [batch, 1])

### Implementation (TDD Green phase)

- [ ] T005 [P] Implement RolloutBuffer in `packages/backend-tfjs/src/memory/RolloutBuffer.ts`
- [ ] T006 [P] Implement buildActorCritic in `packages/backend-tfjs/src/model/BuildActorCritic.ts`

**Checkpoint**: RolloutBuffer and ActorCritic model build, tests pass

---

## Phase 3: User Story 1 — Train a PPO agent (Priority: P1)

**Goal**: PPOAgent can be created, collect experiences, and train with PPO algorithm

**Independent Test**: Create agent, feed experiences, call train(), verify loss computes and tensors are managed

### Tests FIRST (TDD Red phase)

- [ ] T007 [US1] Write PPOAgent construction test — default config, custom config
- [ ] T008 [US1] Write PPOAgent.getAction() test — returns valid action index, uses policy distribution
- [ ] T009 [US1] Write PPOAgent.remember() + train() test — collects nSteps, trains, clears buffer
- [ ] T010 [US1] Write PPOAgent memory stability test — tensor count stable over 100 train() calls

### Implementation (TDD Green phase)

- [ ] T011 [US1] Implement PPOAgent class in `packages/backend-tfjs/src/agents/ppo.ts` — constructor, getAction(), remember(), train(), dispose()

**Checkpoint**: PPOAgent trains on fake environment, all US1 tests pass

---

## Phase 4: User Story 2 — Configure hyperparameters (Priority: P2)

**Goal**: All PPOConfig parameters are respected and have sensible defaults

### Tests FIRST

- [ ] T012 [US2] Write test verifying default config values are applied when only inputSize/actionSize provided
- [ ] T013 [US2] Write test verifying custom config values (clipRatio, gaeLambda, entropyCoeff) are used in training

### Implementation

- [ ] T014 [US2] Ensure PPOAgent constructor applies all defaults and validates config in `packages/backend-tfjs/src/agents/ppo.ts`

**Checkpoint**: Config tests pass, defaults work

---

## Phase 5: User Story 3 — Save and load models (Priority: P3)

**Goal**: PPO model can be saved and loaded for resuming training

### Tests FIRST

- [ ] T015 [US3] Write save/load round-trip test — train, save weights, load into new agent, verify identical predictions

### Implementation

- [ ] T016 [US3] Implement save() and load() methods on PPOAgent in `packages/backend-tfjs/src/agents/ppo.ts`

**Checkpoint**: Save/load tests pass

---

## Phase 6: Polish & Integration

- [ ] T017 Run full test suite (`pnpm test`) — verify no regressions on DQN tests
- [ ] T018 Verify PPOAgent works with IgnitionEnv integration (manual validation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 (types must exist)
- **Phase 3 (US1)**: Depends on Phase 2 (RolloutBuffer + ActorCritic must exist)
- **Phase 4 (US2)**: Depends on Phase 3 (PPOAgent must exist)
- **Phase 5 (US3)**: Depends on Phase 3 (PPOAgent must exist)
- **Phase 6 (Polish)**: Depends on all above

### Within Each Phase

- Tests MUST be written and FAIL before implementation (Constitution Principle I)
- Implementation makes tests pass (Green phase)

### Parallel Opportunities

- T003 + T004 can run in parallel (different test sections)
- T005 + T006 can run in parallel (different files)
- Phase 4 + Phase 5 can run in parallel (independent user stories)
