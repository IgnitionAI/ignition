# IgnitionAI Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)

TDD is the foundation of every change in IgnitionAI. No feature, fix, or refactor ships without tests.

- **Red-Green-Refactor** cycle strictly enforced: write a failing test first, implement the minimum to pass, then refactor.
- Every package (`core`, `backend-tfjs`, `backend-onnx`) must maintain its own test suite under `test/`.
- Tests run via `vitest` from the monorepo root (`pnpm test`). All tests must pass before any merge.
- Coverage targets: critical paths (agents, environments, training loops) must have unit tests. New code without tests is rejected.
- Integration tests are required when: a package contract changes, inter-package communication is modified, or shared types/schemas evolve.

### II. Modular Monorepo Architecture

IgnitionAI is a pnpm monorepo. Each package is an independent, self-contained unit.

- **`packages/core`**: Environment logic (`IgnitionEnv`), shared types, interfaces. Zero heavy dependencies.
- **`packages/backend-tfjs`**: RL agents (DQN, Q-Table, PPO) using TensorFlow.js. Depends only on `core` for interfaces.
- **`packages/backend-onnx`**: Inference-only backend via ONNX Runtime Web. Depends only on `core`.
- **`r3f/target-chasing`**: Demo app. Consumes packages as a user would — never import internals directly.
- New packages must have a clear, singular purpose. No "utils" dumping grounds.
- Cross-package dependencies flow one way: demo -> backends -> core. No circular dependencies.

### III. Robustness & Defensive Design

Code must be resilient, predictable, and fail gracefully.

- **TypeScript strict mode** is mandatory (`"strict": true`). No `any` types in package code — use proper generics and union types.
- Validate at system boundaries: user-provided configurations (agent hyperparameters, environment callbacks), external data (model weights, API responses).
- Tensor operations must handle memory explicitly — `tf.tidy()` for all TensorFlow.js compute paths, `dispose()` for long-lived tensors.
- Training loops must be interruptible and resumable. Never assume infinite resources.
- Error messages must be actionable: state what failed, why, and what the user can do about it.

### IV. Browser-First, Performance-Aware

IgnitionAI runs in the browser. Performance is a feature, not an afterthought.

- Prefer WebGPU > WebGL > WASM > CPU backend selection, with automatic fallback.
- Training loops must not block the main thread. Use `requestAnimationFrame` or `setTimeout` yielding patterns.
- Memory management is critical: cap replay buffers, dispose unused tensors, limit chart data points.
- Bundle size matters: lazy-load heavy dependencies (TensorFlow.js, React Flow, Recharts) where possible.

### V. Clean API & Developer Experience

The public API of each package should be intuitive and minimal.

- Every package exports a clear public surface via its `index.ts`. Internal modules are not part of the API contract.
- Agent interface: `act(observation)`, `train(batch)`, `save()`, `load()` — keep it simple and consistent across backends.
- Environment interface: `step()`, `reset()`, `getObservation()`, `computeReward()`, `isDone()` — no hidden state.
- Configuration objects use sensible defaults. Users should get a working agent with minimal config.
- Breaking API changes require a major version bump and migration documentation.

### VI. Simplicity & YAGNI

Build what is needed now, not what might be needed later.

- No speculative abstractions. Three similar lines of code > premature helper function.
- No feature flags or backwards-compatibility shims — change the code directly.
- Prefer standard library and existing dependencies over adding new ones. Every new dependency must justify its weight.
- Delete dead code. No commented-out blocks, no `// TODO: maybe later` without an associated issue.

## Technology Stack

| Layer | Technology | Constraint |
|---|---|---|
| Language | TypeScript (ESNext, strict) | All packages |
| Build | pnpm monorepo + Vite | Workspace protocol for inter-package deps |
| Testing | Vitest | Unit + integration, run from root |
| RL Backend | TensorFlow.js | WebGPU/WebGL/WASM/CPU |
| Inference | ONNX Runtime Web (planned) | Browser inference only |
| 3D Rendering | React Three Fiber + Rapier | Demo apps only |
| State Management | Zustand | Demo apps only |
| Charts | Recharts | Demo apps only |
| Package Registry | npm (`@ignitionai/*`) | Public scoped packages |

## Development Workflow

1. **Spec first**: Use spec-kit (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`) to define what you're building before writing code.
2. **Branch per feature**: Work on feature branches, never directly on `main`.
3. **Test first**: Write failing tests that define the expected behavior.
4. **Implement**: Write the minimum code to pass the tests.
5. **Refactor**: Clean up while tests stay green.
6. **Review**: All changes go through PR review. Tests must pass in CI.
7. **Document**: Update README / CONTRIBUTION_NOTES if the public API changes.

## Quality Gates

- All Vitest tests pass (`pnpm test`)
- TypeScript compiles without errors (`pnpm build`)
- No `any` types in package source code (enforced via strict mode)
- New agent algorithms include at minimum: unit tests for `act()`, `train()`, `save()`/`load()` round-trip
- Demo changes must not break existing training workflows

## Governance

- This constitution supersedes ad-hoc decisions. When in doubt, refer here.
- Amendments require: documented rationale, review, and an updated version number below.
- All PRs and code reviews must verify compliance with these principles.
- Complexity must be justified — if a reviewer asks "why is this complex?", simplify it.

**Version**: 1.0.0 | **Ratified**: 2026-04-09 | **Last Amended**: 2026-04-09
