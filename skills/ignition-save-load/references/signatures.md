# Signatures used (dev SHA `343a76952f9dcd6594674c3526ee03ee45b4d93e`)

Line numbers are 1-based in that tree.

## Core — `packages/core/src`

### `AgentInterface` persistence (`types.ts`)

- `save?(modelId: string, metadata?: Record<string, unknown>): Promise<string | void>` — `packages/core/src/types.ts:69`
- `load?(modelId: string): Promise<void>` — `packages/core/src/types.ts:72`
- `getState?(): Record<string, unknown>` — `packages/core/src/types.ts:75`
- `setState?(state: Record<string, unknown>): void` — `packages/core/src/types.ts:78`
- `CheckpointableAgent.saveCheckpoint(repoId, token, checkpointName)` — `packages/core/src/types.ts:86`

### `IgnitionEnv` (`ignition-env.ts`)

- `async save(modelId: string, metadata?: Record<string, unknown>): Promise<string | void>` — `packages/core/src/ignition-env.ts:184`
- `async load(modelId: string): Promise<void>` — `packages/core/src/ignition-env.ts:201`
- `public stepCount = 0` — `packages/core/src/ignition-env.ts:15`
- `public train(algorithm?: AlgorithmType, overrides?: Record<string, unknown>): void` — `packages/core/src/ignition-env.ts:41`
- `public stop(): void` — `packages/core/src/ignition-env.ts:147`
- `public infer(): void` — `packages/core/src/ignition-env.ts:111`
- `public inferStep(): Promise<StepResult>` — `packages/core/src/ignition-env.ts:77`

`save` builds metadata `{ algorithm, stepCount, ...getState(), ...metadata }` (`packages/core/src/ignition-env.ts:188-193`). `load` calls `agent.load` then `this.stepCount = 0` (`packages/core/src/ignition-env.ts:205-208`).

## TF.js agents — `packages/backend-tfjs/src`

### Config

- `DQNConfig.storageProvider?: ModelStorageProvider` — `packages/backend-tfjs/src/types.ts:24`
- `PPOConfig.storageProvider?: ModelStorageProvider` — `packages/backend-tfjs/src/types.ts:42`
- `QTableConfig.storageProvider?: ModelStorageProvider` — `packages/backend-tfjs/src/types.ts:57` (unused by Q-table `save`)

### `DQNAgent` (`agents/dqn.ts`)

- `async getAction(state: number[], greedy?: boolean): Promise<number>` — `packages/backend-tfjs/src/agents/dqn.ts:76`
- `getModel(): tf.LayersModel` — `packages/backend-tfjs/src/agents/dqn.ts:96`
- `async saveModel(modelId, metadata?): Promise<string>` — `packages/backend-tfjs/src/agents/dqn.ts:199`
- `async loadModel(modelId: string): Promise<void>` — `packages/backend-tfjs/src/agents/dqn.ts:214`
- `getState(): Record<string, unknown>` — `packages/backend-tfjs/src/agents/dqn.ts:232`
- `setState(state: Record<string, unknown>): void` — `packages/backend-tfjs/src/agents/dqn.ts:240`
- `async save(modelId, metadata?): Promise<string>` — `packages/backend-tfjs/src/agents/dqn.ts:247`
- `async load(modelId: string): Promise<void>` — `packages/backend-tfjs/src/agents/dqn.ts:251`
- `async saveToHub(repoId, token, modelName?, checkpointName?): Promise<void>` — `packages/backend-tfjs/src/agents/dqn.ts:153`
- `async loadFromHub(repoId, modelPath?): Promise<void>` — `packages/backend-tfjs/src/agents/dqn.ts:159`
- `async saveCheckpoint(repoId, token, checkpointName): Promise<void>` — `packages/backend-tfjs/src/agents/dqn.ts:165`
- `async maybeSaveBestCheckpoint(repoId, token, reward, step?): Promise<void>` — `packages/backend-tfjs/src/agents/dqn.ts:173`
- `async loadCheckpoint(repoId, checkpointName): Promise<void>` — `packages/backend-tfjs/src/agents/dqn.ts:183`

### `PPOAgent` (`agents/ppo.ts`)

- `getState()` — `packages/backend-tfjs/src/agents/ppo.ts:441`
- `setState(state)` — `packages/backend-tfjs/src/agents/ppo.ts:448`
- `async save(modelId, metadata?): Promise<string>` — `packages/backend-tfjs/src/agents/ppo.ts:453`
- `async load(modelId: string): Promise<void>` — `packages/backend-tfjs/src/agents/ppo.ts:466`

### `QTableAgent` (`agents/qtable.ts`)

- `getState()` — `packages/backend-tfjs/src/agents/qtable.ts:191`
- `setState(state)` — `packages/backend-tfjs/src/agents/qtable.ts:197`
- `async save(modelId, metadata?): Promise<string>` — `packages/backend-tfjs/src/agents/qtable.ts:205`
- `async load(modelId: string): Promise<void>` — `packages/backend-tfjs/src/agents/qtable.ts:229`

### Runner and IO

- `class IgnitionEnvTFJS extends IgnitionEnv` — `packages/backend-tfjs/src/ignition-env-tfjs.ts:26`
- `export async function saveModelToHub(model, repo, token, subdir?): Promise<void>` — `packages/backend-tfjs/src/io/saveModelToHub.ts:33`
- `export async function loadModelFromHub(repoId, filename?, graphModel?, maxRetries?, initialDelay?)` — `packages/backend-tfjs/src/io/loadModel.ts:23`

(The issue name `loadModel` is this file / `loadModelFromHub`, not DQN's instance method `loadModel`.)

## Storage — `packages/storage/src`

- `interface ModelStorageProvider` `save` / `load` / `list` / `delete` / `exists` — `packages/storage/src/types.ts:10-38`
- `hfStorageConfigSchema` / `parseHFConfig(env?)` — `packages/storage/src/config.ts:3` and `packages/storage/src/config.ts:20`
- `class HuggingFaceProvider` — `packages/storage/src/providers/huggingface.ts:29`
- `class IndexedDBProvider` — `packages/storage/src/providers/indexeddb.ts:10`
- `class LocalStorageProvider` — `packages/storage/src/providers/localstorage.ts:10`
- `class DownloadProvider` — `packages/storage/src/providers/download.ts:8`
- Re-exports — `packages/storage/src/index.ts:1-7`

Umbrella re-exports Hub only: `packages/ignitionai/src/index.ts:68-72`.

## Environment

- `class CartPoleEnv implements TrainingEnv` — `packages/environments/src/cartpole.ts:23`
