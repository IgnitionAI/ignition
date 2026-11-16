# Public signatures used by ignition-train-infer-split

Public `@ignitionai/*` **0.1.0** only. `@ignitionai/viz` is not part of this API.

## Runner (`packages/core/src/ignition-env.ts`)

- `get agent()` — `:33-35`
- `train(algorithm?: AlgorithmType, overrides?: Record<string, unknown>): void` — `:41`
- `step(): Promise<StepResult>` — `:73` (learning transition)
- `inferStep(): Promise<StepResult>` — `:77` (greedy, no remember/train)
- `infer(): void` — `:111` (starts greedy `setTimeout` loop)
- `start(): void` — `:116` (training loop)
- `stop(): void` — `:147` (cancels future ticks; in-flight transition may finish)
- `reset(): void` — `:154`
- `setSpeed(multiplier: number): void` — `:164`
- `save(modelId: string, metadata?: Record<string, unknown>): Promise<string | void>` — `:184`
- `load(modelId: string): Promise<void>` — `:201`
- `lastError: Error | null` — `:14`
- `stepIntervalMs` / `stepsPerTick` — `:18-21`

There is no `IgnitionEnv.dispose()`. Switching algorithms eventually calls
`previous.dispose?.()` on the replaced agent (`:65`).

## Contracts (`packages/core/src/types.ts`)

- `AgentInterface.getAction(observation: number[], greedy?: boolean)` — `:54`
- `AgentInterface.remember` / `train` — `:55-56`
- `AgentInterface.dispose?(): void` — `:62`
- `AgentInterface.save?` / `load?` — `:69-72`
- `AgentInterface.getState?` / `setState?` — `:75-78`
- `StepResult` — `:43-49`
- `TrainingEnv` — `:95-112`
- `InferenceEnv` (`observe` + `step` only) — `:117-122`
- `AlgorithmType` — `:126`

## Validation (`packages/core/src/env-validation.ts`)

- `validateTrainingEnv` — `:9` (constructor of `IgnitionEnv`)
- `validateInferenceEnv` — `:42` (production-shaped env; runner still wants `TrainingEnv`)

## TF.js backend

- `IgnitionEnvTFJS` constructor — `packages/backend-tfjs/src/ignition-env-tfjs.ts:27`
- Factories `dqn` / `ppo` / `qtable` / `double-dqn` — `:8-13`
- `DQNAgent.getAction(state, greedy?)` — `packages/backend-tfjs/src/agents/dqn.ts:76`
- `DQNAgent.getModel(): tf.LayersModel` — `:96`
- `DQNAgent.save` / `load` (need `storageProvider`) — `:247-253`
- `DQNAgent.dispose()` — `:255`
- `DQNConfig.storageProvider?` — `packages/backend-tfjs/src/types.ts:24`
- `DQNConfig.seed?` / `backend?` — `:11-12`

## Storage + env

- `ModelStorageProvider.save/load` — `packages/storage/src/types.ts:14-23`
- `CartPoleEnv` — `packages/environments/src/cartpole.ts:23`

## Facade

- `IgnitionEnvTFJS`, `DQNAgent` re-exported from `packages/ignitionai/src/index.ts:22-27`
- `CartPoleEnv` — `:81-85`
