# Implementation Plan: Environment Auto-Configuration

**Branch**: `004-env-auto-config` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

Refactor `IgnitionEnv` so the developer provides only game logic (observation, actions, reward, termination) and calls `env.train('dqn')`. The env auto-deduces `inputSize`/`actionSize` and creates the agent with sensible defaults. Backwards compatible — existing explicit-agent API still works.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict mode)  
**Primary Dependencies**: @ignitionai/core (IgnitionEnv, types), @ignitionai/backend-tfjs (DQN, PPO, QTable)  
**Testing**: Vitest  
**Target Platform**: Browser + Node.js  
**Project Type**: Library (npm package)  
**Constraints**: No circular dependencies (core cannot import backend-tfjs). Agent creation must be injectable.

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| TDD (non-negotiable) | PASS | Tests first for: auto-config, defaults, train/stop lifecycle, algo switching |
| Modular monorepo | PASS | Core stays dependency-free. Agent factories injected, not imported. |
| Robustness & defensive design | PASS | Zod validation on overrides, clear errors for invalid actions/observations |
| Browser-first, performance-aware | PASS | No new deps. Training loop already non-blocking (setTimeout) |
| Clean API & DX | PASS | This IS the DX improvement. 10 lines to training agent. |
| Simplicity & YAGNI | PASS | No abstractions beyond what's needed. Defaults are a plain object, not a class. |

**Critical design constraint**: `@ignitionai/core` must NOT depend on `@ignitionai/backend-tfjs` (circular dep). Solution: `backend-tfjs` exports an enhanced `IgnitionEnv` subclass with agent factories baked in. Core stays clean.

## Architecture

### New API (additive — old API still works)

```ts
// OLD API (still works, unchanged)
const agent = new DQNAgent({ inputSize: 4, actionSize: 2, ... });
const env = new IgnitionEnv({ agent, getObservation, applyAction, ... });

// NEW API — the dev only writes game logic
import { IgnitionEnv } from '@ignitionai/backend-tfjs';

const env = new IgnitionEnv({
  getObservation: () => [x, y, targetX, targetY],
  actions: ['left', 'right', 'jump'],
  applyAction: (action) => { ... },
  computeReward: () => ...,
  isTerminated: () => ...,
  onReset: () => { ... },
});

env.train();                           // DQN with auto-defaults
env.train('ppo');                      // PPO with auto-defaults
env.train('dqn', { lr: 0.01 });       // DQN with override
env.stop();                            // pause
env.train();                           // resume
```

### train() flow

1. Call `getObservation()` → deduce `inputSize` from array length
2. Read `actions` → deduce `actionSize` (number or string[].length)
3. Look up defaults for the requested algorithm
4. Merge: `{ ...defaults, ...overrides, inputSize, actionSize }`
5. Call the agent factory → create the agent
6. Set `this.agent` and start the training loop

### Default hyperparameters per algorithm

```
DQN:    hiddenLayers=[64,64], gamma=0.99, epsilon=1.0, epsilonDecay=0.995, lr=0.001, batchSize=32
PPO:    hiddenLayers=[64,64], gamma=0.99, gaeLambda=0.95, clipRatio=0.2, lr=3e-4, epochs=4
QTable: stateBins=10, gamma=0.99, epsilon=1.0, epsilonDecay=0.995, lr=0.1
```

## Project Structure

```text
packages/core/src/
├── ignition-env.ts          # MODIFIED: accept config without agent, add train() stub
├── types.ts                 # MODIFIED: add AgentFactory, AlgorithmType
├── schemas.ts               # MODIFIED: make agent optional in config
├── defaults.ts              # NEW: base defaults structure + merge logic
└── index.ts                 # MODIFIED: export new types

packages/backend-tfjs/src/
├── ignition-env-tfjs.ts     # NEW: IgnitionEnv subclass with DQN/PPO/QTable factories
├── defaults.ts              # NEW: concrete defaults for each TF.js algorithm
└── index.ts                 # MODIFIED: re-export IgnitionEnv from here

packages/core/test/
├── ignition-env.test.ts     # MODIFIED: add train() lifecycle tests
└── defaults.test.ts         # NEW: defaults merge logic tests

packages/backend-tfjs/test/
└── auto-config.test.ts      # NEW: end-to-end auto-config convergence tests
```

## Complexity Tracking

No constitution violations. No complexity justifications needed.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Circular dep core ↔ backend-tfjs | Subclass pattern — core defines base, backend-tfjs extends |
| Defaults don't converge for all envs | Tested on GridWorld. Docs state "defaults work for simple envs" |
| Breaking existing API | Fully backwards compatible — `agent` in config becomes optional |
| Name collision: IgnitionEnv exported from both packages | backend-tfjs re-exports as `IgnitionEnv` (enhanced), core as `IgnitionEnvBase` if needed |
