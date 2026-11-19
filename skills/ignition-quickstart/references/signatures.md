# Public API used by ignition-quickstart

Pinned to `@ignitionai/*` **0.1.0**. Line numbers are 1-based in that tree.

## Packages

- `@ignitionai/core` `0.1.0` — `packages/core/package.json`
- `@ignitionai/backend-tfjs` `0.1.0` — `packages/backend-tfjs/package.json`
- `@ignitionai/environments` `0.1.0` — `packages/environments/package.json`

## Signatures

| Use | Signature | Cite |
|---|---|---|
| TF.js runner | `export class IgnitionEnvTFJS extends IgnitionEnv` | `packages/backend-tfjs/src/ignition-env-tfjs.ts:26` |
| Re-export | `export { IgnitionEnvTFJS, IgnitionEnvTFJS as IgnitionEnv }` | `packages/backend-tfjs/src/index.ts:11` |
| CartPole class | `export class CartPoleEnv implements TrainingEnv` | `packages/environments/src/cartpole.ts:23` |
| CartPole export | `export { CartPoleEnv } from './cartpole'` | `packages/environments/src/index.ts:2` |
| CartPole actions | `actions = ['push_left', 'push_right']` | `packages/environments/src/cartpole.ts:24` |
| CartPole observe | `observe(): number[]` | `packages/environments/src/cartpole.ts:41` |
| CartPole step | `step(action: number \| number[]): void` | `packages/environments/src/cartpole.ts:45` |
| CartPole reward | `reward(): number` | `packages/environments/src/cartpole.ts:67` |
| CartPole done | `done(): boolean` | `packages/environments/src/cartpole.ts:71` |
| CartPole reset | `reset(): void` | `packages/environments/src/cartpole.ts:79` |
| Env contract | `export interface TrainingEnv` | `packages/core/src/types.ts:95` |
| Train | `public train(algorithm?: AlgorithmType, overrides?: Record<string, unknown>): void` | `packages/core/src/ignition-env.ts:41` |
| Manual step | `public step(): Promise<StepResult>` | `packages/core/src/ignition-env.ts:73` |
| Greedy step | `public inferStep(): Promise<StepResult>` | `packages/core/src/ignition-env.ts:77` |
| Infer loop | `public infer(): void` | `packages/core/src/ignition-env.ts:111` |
| Stop | `public stop(): void` | `packages/core/src/ignition-env.ts:147` |
| Speed | `public setSpeed(multiplier: number): void` | `packages/core/src/ignition-env.ts:164` |
| lastError | `public lastError: Error \| null = null` | `packages/core/src/ignition-env.ts:14` |
| stepCount | `public stepCount = 0` | `packages/core/src/ignition-env.ts:15` |
| Algorithm union | `export type AlgorithmType = 'dqn' \| 'double-dqn' \| 'ppo' \| 'qtable'` | `packages/core/src/types.ts:126` |
| DQN seed | `seed?: number` on `DQNConfig` | `packages/backend-tfjs/src/types.ts:11` |
| Seed schema | `seed: z.number().int().min(1).max(1000000).optional()` | `packages/backend-tfjs/src/schemas.ts:10` |
| DQN defaults | `hiddenLayers: [64, 64], ...` | `packages/backend-tfjs/src/defaults.ts:1-11` |
| Merge overrides | `export function mergeDefaults(...)` | `packages/core/src/defaults.ts:5` |
| Agent dispose | `dispose?(): void` | `packages/core/src/types.ts:62` |

## Docs source for the 7-line example

`packages/web/content/en/quickstart.mdx` (install + `IgnitionEnvTFJS` + `CartPoleEnv` + `train('dqn')`).
