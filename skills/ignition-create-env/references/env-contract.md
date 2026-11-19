# TrainingEnv contract (`@ignitionai/*` 0.1.0)

Signatures below are from the published 0.1.0 API.

## Spaces (`packages/core/src/types.ts`)

These types describe geometry. `TrainingEnv` does **not** attach them; the runner
reads `actions` and `observe()`.

- `DiscreteSpace` — `packages/core/src/types.ts:5-8` (`type: 'discrete'`, `n`)
- `BoxSpace` — `packages/core/src/types.ts:11-16` (`type: 'box'`, `low`, `high`, `shape`)
- `MultiDiscreteSpace` — `packages/core/src/types.ts:18-22` (`type: 'multidiscrete'`, `nvec`)
- `ActionSpace` / `ObservationSpace` — `packages/core/src/types.ts:24-25`

Map a custom env:

| World | ActionSpace | ObservationSpace |
|---|---|---|
| 1D line, left/right | `{ type: 'discrete', n: 2 }` | `{ type: 'box', low: [0], high: [1], shape: [1] }` |
| GridWorld 4-move | discrete `n=4` (`actions` length) | box shape `[4]` (normalized row/col + target) |
| CartPole left/right | discrete `n=2` | box shape `[4]` (x, xDot, theta, thetaDot) |
| MountainCar 3-push | discrete `n=3` | box shape `[2]` (position, velocity) |

## `TrainingEnv` (`packages/core/src/types.ts:95-112`)

Required:

- `actions: string[] | number`
- `observe(): number[]`
- `step(action: number | number[]): void`
- `reward(): number`
- `done(): boolean`
- `reset(): void`

Optional:

- `terminated?(): boolean` — terminal condition (goal, failure)
- `truncated?(): boolean` — external limit (time / step cap); default false

`InferenceEnv` (`packages/core/src/types.ts:117-122`) is `observe` + `step` only.

## `StepResult` and flags (`packages/core/src/types.ts:34-49`)

`Experience` and `StepResult` both carry:

- `terminated` — episode ended because of a terminal condition
- `truncated` — episode ended because of a time/step limit

## How `IgnitionEnv` computes flags (`packages/core/src/ignition-env.ts:87-108`)

```
truncated = env.truncated?.() ?? false
terminated = env.terminated?.() ?? (env.done() && !truncated)
```

If `terminated || truncated`, the runner calls `env.reset()` **after** recording
the last observation. `step()` returns that last observation, not the post-reset
one (`packages/core/src/ignition-env.ts:73-75`, `:102-108`).

`new IgnitionEnv(env)` validates then snapshots `env.observe()` (`packages/core/src/ignition-env.ts:27-31`).

`train(algorithm?, overrides?)` needs a factory (`packages/core/src/ignition-env.ts:41-71`).
Bare `@ignitionai/core` `IgnitionEnv` has none; use `IgnitionEnvTFJS`
(`packages/backend-tfjs/src/ignition-env-tfjs.ts:26-32`) whose factories include
`qtable` (`packages/backend-tfjs/src/ignition-env-tfjs.ts:8-13`).

## Validation (`packages/core/src/env-validation.ts`)

`validateTrainingEnv` (`packages/core/src/env-validation.ts:9-40`) requires
`observe`, `step`, `reward`, `done`, `reset` as functions, optional
`terminated`/`truncated` as functions if present, and `actions` as a non-empty
`string[]` or a positive number.

`validateInferenceEnv` (`packages/core/src/env-validation.ts:42-50`) requires
`observe` and `step`.

Real errors (assert them, do not match loosely):

- not an object: `[IgnitionAI] Environment must be an object implementing TrainingEnv`
- missing method: `[IgnitionAI] TrainingEnv must implement <name>() as a function`
- missing actions: `[IgnitionAI] TrainingEnv must have an actions property (string[] or number)`
- empty / non-positive actions: `[IgnitionAI] TrainingEnv.actions must have at least one action`
- wrong actions type: `[IgnitionAI] TrainingEnv.actions must be a string[] or a positive number`

## Reference environments

- `GridWorldEnv` — `packages/environments/src/gridworld.ts:3-59`
- `CartPoleEnv` — `packages/environments/src/cartpole.ts:23-82`
- `MountainCarEnv` — `packages/environments/src/mountaincar.ts:12-61`

All three implement `done()` only. Their `done()` mixes success/failure with a
step cap (`gridworld.ts:48-51`, `cartpole.ts:71-77`, `mountaincar.ts:47-49`).
New envs should split `terminated()` and `truncated()` as in
`examples/skill-create-env.ts`.

## Q-learning and truncation

`QTableAgent.train` (`packages/backend-tfjs/src/agents/qtable.ts:147-152`) uses
`terminated` as the Bellman `done` flag. A **truncated** (non-terminal)
transition still bootstraps from the successor. That matches time-limit
semantics: the world did not end, the episode was cut.

## Known gaps (report, do not patch packages)

1. Space types are exported from `packages/core/src/index.ts:15-19` but unused by
   `TrainingEnv` / `IgnitionEnv`.
2. Reference envs do not implement `terminated()` / `truncated()`; their `done()`
   mixes goal/failure with a step cap.
