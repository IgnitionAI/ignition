---
name: ignition-create-env
description: Use when writing, validating, or wrapping a custom IgnitionRL TrainingEnv (discrete, box, or multidiscrete observations/actions), distinguishing terminated vs truncated, calling validateTrainingEnv, or constructing IgnitionEnv / IgnitionEnvTFJS. Teaches a valid 1D env, rejection of invalid envs, and a short measured training run.
---

# ignition-create-env

Teach an agent how to write a custom environment that matches the framework
contract for `@ignitionai/*` **0.1.0**.

Executable example: `examples/skill-create-env.ts` (tests in
`examples/skill-create-env.test.ts`). Full signatures:
[references/env-contract.md](references/env-contract.md).

## When to use

- The user wants a **custom** env (game, sim, 1D toy), not only CartPole.
- Validation throws `[IgnitionAI] TrainingEnv must implement …`.
- Episode ends mix **goal/failure** with a **step limit**.
- You need to wrap a world in `IgnitionEnv` / `IgnitionEnvTFJS` and call `train()`.

Do not use this skill for ONNX export, checkpoint I/O, or reward-shaping recipes.

## Contract (minimum)

Implement `TrainingEnv` (`packages/core/src/types.ts:95-112`):

```ts
import type { TrainingEnv } from '@ignitionai/core';

class LineWorldEnv implements TrainingEnv {
  actions = ['left', 'right'];          // or a positive number
  observe(): number[] { /* vector */ }
  step(action: number | number[]): void { /* mutate world */ }
  reward(): number { /* scalar */ }
  done(): boolean { return this.terminated() || this.truncated(); }
  terminated(): boolean { /* goal / failure */ }
  truncated(): boolean { /* time limit, and not terminated */ }
  reset(): void { /* start of episode */ }
}
```

`observe()` is the observation **vector** (typically a `BoxSpace` of `shape [k]`).
`actions` is the discrete action count or names (`DiscreteSpace.n`).
Space **interfaces** (`DiscreteSpace` `:5-8`, `BoxSpace` `:11-16`,
`MultiDiscreteSpace` `:18-22`) are types only — the runner never reads a `space`
field. See the reference table in `references/env-contract.md`.

## Validate, then wrap

```ts
import { IgnitionEnv, validateTrainingEnv } from '@ignitionai/core';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';

validateTrainingEnv(world);     // packages/core/src/env-validation.ts:9-40
const inspect = new IgnitionEnv(world); // constructor validates: ignition-env.ts:27-31
inspect; // no factories — train() throws Unknown algorithm

const runner = new IgnitionEnvTFJS(world); // packages/backend-tfjs/src/ignition-env-tfjs.ts:26-32
runner.train('qtable', { stateBins: 8, stateLow: [0], stateHigh: [1] });
runner.stop();                  // halt the async loop; drive with await runner.step()
```

Invalid worlds must be rejected with the **real** message, for example missing
`done()`:

`[IgnitionAI] TrainingEnv must implement done() as a function`

(`packages/core/src/env-validation.ts:3-6`, `:16-20`).

## `terminated` vs `truncated`

Comments on `Experience` (`packages/core/src/types.ts:34-37`) and `StepResult`
(`:43-49`):

| Flag | Meaning | Typical cause |
|---|---|---|
| `terminated` | Episode hit a **terminal** condition | Goal reached, pole fell, crash |
| `truncated` | Episode hit an **external** limit | `maxSteps`, wall-clock |

`IgnitionEnv.performStep` (`packages/core/src/ignition-env.ts:96-108`):

1. `truncated = env.truncated?.() ?? false`
2. `terminated = env.terminated?.() ?? (env.done() && !truncated)`
3. If either is true, `reset()` runs **after** `remember()`, and `step()` still
   returns the **last** observation.

Prefer implementing both optional methods so a time-limit end is not treated as
a terminal success/failure. `done()` should stay true when either flag is true
(legacy path).

## Reference envs

Copy structure, not their episode-end mixing:

- `GridWorldEnv` — `packages/environments/src/gridworld.ts:3`
- `CartPoleEnv` — `packages/environments/src/cartpole.ts:23`
- `MountainCarEnv` — `packages/environments/src/mountaincar.ts:12`

Each uses `done()` for **both** success/failure and a step cap. New code should
split flags (see LineWorld in the example).

## Short training (declare budget first)

Do not claim the policy solved the env without numbers.

Declared in `examples/skill-create-env.ts` **before** any run:

- Budget: `200` env steps per seed (`TRAINING_BUDGET_STEPS`)
- Seeds: `7`, `11`, `19`
- Algorithm: `qtable` (tabular; no neural net)
- Drive with `await runner.step()` after `train()` + `stop()` so the test stays
  under 60s CPU

Record `completedSteps`, `terminatedEpisodes`, `truncatedEpisodes`, and
`episodeReturns`. Print raw JSON. Failures stay in the log.

## Common mistakes

- Forgetting `done()` or `reset()` — validation throws at construct time.
- Empty `actions` / `actions: 0` — “must have at least one action”.
- Using core `IgnitionEnv.train()` without TF.js factories.
- Putting the step cap only in `done()` and omitting `truncated()`.
- Asserting `toThrow(/done/)` instead of the exact `[IgnitionAI] …` string.
- Mutating package code to “fix” spaces or reference envs — report the gap.

## Checklist

1. Class implements `TrainingEnv` (and optional `terminated` / `truncated`).
2. `validateTrainingEnv(world)` succeeds; an invalid object throws the real error.
3. `new IgnitionEnvTFJS(world)` + `train('qtable'| 'dqn' | 'ppo')`.
4. `StepResult.terminated` / `.truncated` match the intended end condition.
5. Budget and ≥3 seeds declared, then measured.
