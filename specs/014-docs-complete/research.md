# Phase 0 Research: Complete Documentation Site

**Feature**: 014-docs-complete
**Date**: 2026-04-13

## R1 — Hyperparameter defaults in `@ignitionai/backend-tfjs`

These are the exact values that the Algorithms pages must cite. Every number here was pulled from source and must be re-verified at ship time before merging the algorithm pages.

### DQN (`packages/backend-tfjs/src/agents/dqn.ts`)

| Hyperparameter | Default | File:line |
|---|---|---|
| Hidden layers | `[24, 24]` | `agents/dqn.ts:35` |
| Gamma (discount) | `0.99` | `agents/dqn.ts:36` |
| Epsilon start | `1.0` | `agents/dqn.ts:37` |
| Epsilon decay | `0.995` | `agents/dqn.ts:38` |
| Epsilon min | `0.01` | `agents/dqn.ts:39` |
| Learning rate | `0.001` | `agents/dqn.ts:40` |
| Batch size | `32` | `agents/dqn.ts:41` |
| Replay buffer size | `10000` | `agents/dqn.ts:42` |
| Target update frequency | `1000` | `agents/dqn.ts:43` |

**Decision**: The DQN docs page cites the agent constructor values (`agents/dqn.ts`), not `defaults.ts`.
**Rationale**: The constructor is the canonical source for what a user actually gets when they call `env.train('dqn')` without config. `defaults.ts` may be stale.
**Alternatives considered**: Citing `defaults.ts` — rejected because there is a known discrepancy: `defaults.ts:3-13` lists `targetUpdateFrequency: 100` whereas the constructor default is `1000`. This discrepancy must be flagged to the framework team after shipping the docs, but the docs themselves must reflect runtime behavior, not dead config.

### PPO (`packages/backend-tfjs/src/agents/ppo.ts`)

| Hyperparameter | Default | File:line |
|---|---|---|
| Hidden layers | `[64, 64]` | `agents/ppo.ts:138` |
| Learning rate | `3e-4` (`0.0003`) | `agents/ppo.ts:139` |
| Gamma | `0.99` | `agents/ppo.ts:140` |
| GAE lambda | `0.95` | `agents/ppo.ts:141` |
| Clip ratio | `0.2` | `agents/ppo.ts:142` |
| Epochs per update | `4` | `agents/ppo.ts:143` |
| Minibatch size | `64` | `agents/ppo.ts:144` |
| Entropy coefficient | `0.01` | `agents/ppo.ts:145` |
| Value loss coefficient | `0.5` | `agents/ppo.ts:146` |

### Q-Table (`packages/backend-tfjs/src/agents/qtable.ts`)

| Hyperparameter | Default | File:line |
|---|---|---|
| State bins (discretization) | `10` | `agents/qtable.ts:44` |
| Learning rate | `0.1` | `agents/qtable.ts:47` |
| Gamma | `0.99` | `agents/qtable.ts:48` |
| Epsilon start | `1.0` | `agents/qtable.ts:49` |
| Epsilon decay | `0.995` | `agents/qtable.ts:50` |
| Epsilon min | `0.01` | `agents/qtable.ts:51` |

### Known discrepancy (out of scope for this feature)

`backend-tfjs/src/defaults.ts` disagrees with `agents/dqn.ts` on `targetUpdateFrequency` (`100` vs `1000`). This is a framework bug, not a doc bug — the docs cite the constructor value (`1000`), which is what actually runs. File an issue after shipping 014.

## R2 — Public API surface per package

These are the symbols each "How it works" page must document. "Public" means exported from the top-level `src/index.ts`.

### `@ignitionai/core`

- `version` — framework semver string
- `IgnitionEnv` — base training environment class (agent lifecycle, training loop)
- Types: `TFBackend`, `AgentInterface`, `AgentFactory`, `AlgorithmType`, `CheckpointableAgent`, `Experience`, `StepResult`, `TrainingEnv`, `InferenceEnv`, `ActionSpace`, `ObservationSpace`, `DiscreteSpace`, `BoxSpace`, `MultiDiscreteSpace`
- `mergeDefaults()` — merge algorithm defaults with user config
- `validateTrainingEnv()` / `validateInferenceEnv()` — interface compliance validators
- `ExperienceSchema` — Zod schema for `Experience`

**Source**: `packages/core/src/index.ts`.

**Docs focus**: `TrainingEnv` interface (5 methods + `actions`), auto-configuration (how `inputSize` is deduced from `observe()` length and `actionSize` from `actions.length`), and how the base `IgnitionEnv` orchestrates step/reward/done/reset inside its training loop.

### `@ignitionai/backend-tfjs`

- Agents: `DQNAgent`, `PPOAgent`, `QTableAgent`
- Infrastructure: `ReplayBuffer`, `buildQNetwork`
- Backend control: `setBackend()`, `getAvailableBackends()`
- Environment: `IgnitionEnvTFJS` (also aliased as `IgnitionEnv`)
- Config schemas: `DQNConfigSchema`, `PPOConfigSchema`, `QTableConfigSchema`
- Defaults constants: `ALGORITHM_DEFAULTS`, `DQN_DEFAULTS`, `PPO_DEFAULTS`, `QTABLE_DEFAULTS`
- Types: `TFBackend`, `AgentInterface`, `Experience`, `DQNConfig`, `PPOConfig`, `QTableConfig`

**Source**: `packages/backend-tfjs/src/index.ts`.

**Docs focus**: backend selection (WebGPU → WebGL → WASM → CPU), how the training loop is decoupled from the render loop (`stepIntervalMs` + `stepsPerTick`), and how `env.setSpeed(multiplier)` works internally.

### `@ignitionai/backend-onnx`

- `OnnxAgent` — inference-only agent using `onnxruntime-node`
- `OnnxAgentConfig`, `OnnxAgentConfigSchema` — Zod-validated config
- `saveForOnnxExport()` — export a TF.js model to an ONNX-ready format
- `generateConversionScript()` — emit a Python/CLI conversion script
- `ExportResult` — result type
- `loadOnnxModelFromHub()` — load ONNX model from HuggingFace Hub
- `createOnnxSession()`, `runInference()`, `inspectSession()` — low-level ORT helpers

**Source**: `packages/backend-onnx/src/index.ts`.

**Docs focus**: the Train → Export → Convert → Deploy pipeline, with one code example per stage, plus a note that the Python conversion step is a one-time setup.

### `@ignitionai/storage`

- Types: `ModelStorageProvider`, `ModelInfo`
- HuggingFace config: `hfStorageConfigSchema`, `HFStorageConfig`, `parseHFConfig()`
- `HuggingFaceProvider` — implementation of `ModelStorageProvider` for HF Hub

**Source**: `packages/storage/src/index.ts`.

**Docs focus**: a complete save/load round-trip using `HuggingFaceProvider`, plus the `ModelStorageProvider` interface as the extension point for future storage backends.

## R3 — Publication state on npm

All four packages declare themselves as publishable scoped packages at version `0.1.0`. None is marked `private`. Each has `publishConfig.access = "public"`.

| Package | name | version | private | publishConfig |
|---|---|---|---|---|
| core | `@ignitionai/core` | `0.1.0` | — | `{"access":"public"}` |
| backend-tfjs | `@ignitionai/backend-tfjs` | `0.1.0` | — | `{"access":"public"}` |
| backend-onnx | `@ignitionai/backend-onnx` | `0.1.0` | — | `{"access":"public"}` |
| storage | `@ignitionai/storage` | `0.1.0` | — | `{"access":"public"}` |

**Decision**: All four backend pages get the same install-command shape — `npm install @ignitionai/<pkg>`. Before shipping the docs, run `npm view @ignitionai/<pkg> version` against each scope to verify the package actually resolves on the public registry. If a package is not yet published (e.g., `backend-onnx` or `storage`), the page must add a callout: *"This package ships with the monorepo; the public npm release is pending. Use `pnpm --filter @ignitionai/<pkg> build` to build from source."*
**Rationale**: FR-003 requires one page per backend regardless of publish state. FR-009 and SC-004 require every copy-paste code block to work. A callout reconciles both.
**Alternatives considered**: Hiding unpublished-backend pages until their npm release — rejected because it breaks FR-003 and because users who read the source already know the package exists.

### Verified npm publish state

**Initial check (T008, 2026-04-13 morning)**: only `@ignitionai/core` and `@ignitionai/backend-tfjs` were live. `backend-onnx`, `storage`, and `environments` were all unpublished — docs carried "publish pending" callouts, and the Quickstart inlined a full `CartPoleEnv` to avoid the broken `environments` import.

**Post-publish (2026-04-13 evening)**: all five backend packages are now live on npm at `0.1.0`. The "publish pending" callouts have been removed. The Quickstart now imports `CartPoleEnv` from `@ignitionai/environments` as originally intended.

| Package | Registry state |
|---|---|
| `@ignitionai/core` | ✓ Published at `0.1.0` |
| `@ignitionai/backend-tfjs` | ✓ Published at `0.1.0` |
| `@ignitionai/backend-onnx` | ✓ Published at `0.1.0` |
| `@ignitionai/storage` | ✓ Published at `0.1.0` |
| `@ignitionai/environments` | ✓ Published at `0.1.0` |
