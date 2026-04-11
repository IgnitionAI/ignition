# Feature Specification: Ship v0.1.0

**Feature Branch**: `010-ship-v0-1`  
**Created**: 2026-04-11  
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install and Use (Priority: P1)

A developer discovers IgnitionAI. They run `npm install @ignitionai/backend-tfjs @ignitionai/core`. It installs. They copy the 10-line example from the README, run it, and their agent starts training. No git clone, no monorepo setup, no build step. It just works.

**Why this priority**: Without npm packages, IgnitionAI doesn't exist to the outside world. This is the difference between "a GitHub repo" and "a real framework."

**Independent Test**: In a fresh empty project, `npm install @ignitionai/backend-tfjs @ignitionai/core`, import IgnitionEnv, create a TrainingEnv, call `env.train()` — it works.

**Acceptance Scenarios**:

1. **Given** a fresh Node.js project, **When** the developer runs `npm install @ignitionai/core @ignitionai/backend-tfjs`, **Then** both packages install without errors
2. **Given** installed packages, **When** the developer imports `IgnitionEnv` from `@ignitionai/backend-tfjs` and creates a TrainingEnv, **Then** `env.train()` creates an agent and starts training
3. **Given** the npm registry, **When** anyone searches for `@ignitionai`, **Then** they find 5 packages: core, backend-tfjs, backend-onnx, storage, environments
4. **Given** each package, **When** the developer checks the version, **Then** it shows `0.1.0`

---

### User Story 2 - Reference Environments (Priority: P2)

A developer wants to test their setup or benchmark algorithms. They install `@ignitionai/environments` and get GridWorld, CartPole, and MountainCar out of the box. Each environment implements `TrainingEnv` — plug and play.

**Why this priority**: Reference environments prove the framework works and give developers a starting point. They're also used in the demos and tests.

**Independent Test**: `npm install @ignitionai/environments`, import `GridWorldEnv`, pass it to `IgnitionEnv`, call `train()` — agent learns.

**Acceptance Scenarios**:

1. **Given** `@ignitionai/environments` installed, **When** the developer imports `GridWorldEnv`, **Then** it implements `TrainingEnv` and works with `IgnitionEnv`
2. **Given** the environments package, **Then** GridWorld, CartPole, and MountainCar are all available
3. **Given** any reference environment, **When** passed to `IgnitionEnv`, **Then** auto-config deduces correct inputSize and actionSize

---

### User Story 3 - Quality Gate (Priority: P3)

A contributor opens a pull request. Automated tests run. If any test fails or the build breaks, the PR cannot be merged. The maintainer reviews with confidence — "tests pass, build passes, it's safe."

**Why this priority**: Without CI/CD, every merge is a gamble. Automated quality gates prevent regressions and build trust with contributors.

**Independent Test**: Open a PR with a failing test → CI blocks merge. Fix the test → CI passes → merge allowed.

**Acceptance Scenarios**:

1. **Given** a PR is opened, **When** the CI pipeline runs, **Then** all tests across all packages execute automatically
2. **Given** a failing test in any package, **When** the CI pipeline completes, **Then** the PR is marked as failing and merge is blocked
3. **Given** all tests pass and build succeeds, **When** the CI pipeline completes, **Then** the PR is marked as passing and merge is allowed

---

### Edge Cases

- What if a package has no tests? CI should still build it. Empty test suites pass.
- What if npm publish fails (name taken, auth issue)? Fail loudly with clear error. Retry manually.
- What if a dependency between packages breaks? CI runs `pnpm -r run build` which catches cross-package type errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CI pipeline MUST run all tests (`pnpm -r run test`) on every pull request
- **FR-002**: CI pipeline MUST build all packages (`pnpm -r run build`) on every pull request
- **FR-003**: CI pipeline MUST block merge when tests or build fail
- **FR-004**: All 5 packages MUST be published to npm as v0.1.0: core, backend-tfjs, backend-onnx, storage, environments
- **FR-005**: Each published package MUST include compiled output, type declarations, and README
- **FR-006**: The `@ignitionai/environments` package MUST export `GridWorldEnv`, `CartPoleEnv`, and `MountainCarEnv`
- **FR-007**: Each environment in the environments package MUST implement the `TrainingEnv` interface from `@ignitionai/core`
- **FR-008**: A CHANGELOG.md MUST document what's in v0.1.0
- **FR-009**: The `main` and `types` fields in each package.json MUST point to the correct compiled files

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm install @ignitionai/core @ignitionai/backend-tfjs` succeeds in under 30 seconds on a standard connection
- **SC-002**: 5 packages visible on npmjs.com under the `@ignitionai` scope
- **SC-003**: CI pipeline runs and reports within 5 minutes of PR creation
- **SC-004**: Zero test failures on the `main` branch at the time of publish
- **SC-005**: A developer can go from `npm install` to a training agent in under 5 minutes using only README instructions

## Assumptions

- The `@ignitionai` npm scope is available (or already claimed by the project owner)
- npm publish will be done manually for v0.1.0 (automated publish via CI can come later)
- The CI pipeline uses a free tier (GitHub Actions free minutes for public repos)
- The environments package is new — no backwards compatibility concerns
- Demo packages (demo-gridworld, demo-cartpole, demo-mountaincar) are NOT published — they stay private
