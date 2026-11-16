---
name: ignition-quickstart
description: Entry point for IgnitionRL. Install @ignitionai/core, @ignitionai/backend-tfjs, and @ignitionai/environments; run the CartPole docs Quickstart; call stop() to halt the loop; then choose the next skill. Use when starting from zero, indexing Ignition skills, or mapping a goal to a skill.
---

# Ignition Quickstart

Use this skill to go from an empty project to a running CartPole DQN loop, then pick the next skill. Packages are `@ignitionai/*` **0.1.0** as published from `dev` SHA `343a76952f9dcd6594674c3526ee03ee45b4d93e`.

Do not claim the pole stays up, that training converged, or that a seed is reproducible for the environment unless you measured it. `CartPoleEnv` draws the initial state with `Math.random()` and has no seed argument.

## Install

From the docs Quickstart (`packages/web/content/en/quickstart.mdx`):

```bash
npm install @ignitionai/core @ignitionai/backend-tfjs @ignitionai/environments
```

or:

```bash
pnpm add @ignitionai/core @ignitionai/backend-tfjs @ignitionai/environments
```

Need Node.js 20+ and an ES-module bundler (Vite, Next.js, Webpack 5, …) for browser work. Tests in this repo run under Node with `backend: 'cpu'`.

## Docs Quickstart (CartPole)

Create `src/main.ts`:

```ts
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs'
import { CartPoleEnv } from '@ignitionai/environments'

const env = new IgnitionEnvTFJS(new CartPoleEnv())

env.train('dqn')       // starts the automatic DQN loop
// env.infer()         // greedy loop after an agent exists
// env.setSpeed(50)    // faster automatic ticks
```

What those calls do on this SHA:

- `new CartPoleEnv()` — built-in `TrainingEnv`: actions `push_left` / `push_right`, 4-D observe, Euler physics, `done()` when the pole tips past 12°, the cart leaves `±2.4`, or 500 env steps elapse.
- `new IgnitionEnvTFJS(env)` — TF.js factories for `dqn`, `double-dqn`, `ppo`, `qtable`. Input size is `observe().length`; action size is `actions.length`.
- `train('dqn')` — creates a DQN agent from `ALGORITHM_DEFAULTS.dqn` and starts the automatic loop (`stepIntervalMs` 50, `stepsPerTick` 1).
- `stop()` — cancels future ticks. A transition already started may finish. `lastError` holds automatic-loop failures.
- `step()` / `inferStep()` — one serialized transition (train vs greedy).

Runtime DQN defaults live in `packages/backend-tfjs/src/defaults.ts` (`hiddenLayers: [64, 64]`, not the `[24, 24]` still written in some comments and in the web Quickstart narrative). Cite exact `file:line` from [references/signatures.md](references/signatures.md).

## Bound the loop (required)

`train()` does not stop by itself. For scripts and tests: declare **budget** and **seeds** (at least three) **before** any `train()` / `step()`, then halt the automatic loop.

```ts
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs'
import { CartPoleEnv } from '@ignitionai/environments'

const SEEDS = [11, 29, 47]
const TRANSITIONS = 8

export async function runSeed(seed: number) {
  const env = new IgnitionEnvTFJS(new CartPoleEnv())
  env.train('dqn', {
    backend: 'cpu',
    seed,
    hiddenLayers: [8],
    batchSize: 4,
    memorySize: 64,
  })
  env.stop()
  const rewards: number[] = []
  for (let i = 0; i < TRANSITIONS; i++) {
    rewards.push((await env.step()).reward)
  }
  env.stop()
  env.agent?.dispose?.()
  return { seed, stepCount: env.stepCount, rewards, lastError: env.lastError }
}
```

`DQNConfig.seed` (integer 1–1_000_000) seeds the agent. It does **not** seed `CartPoleEnv`. Paste raw rewards; do not invent a success threshold.

Runnable copy: `examples/skill-quickstart.ts` (tested by `examples/skill-quickstart.test.ts`).

## I want… → skill

| I want… | Skill | Path |
|---|---|---|
| A first CartPole agent and this index | **ignition-quickstart** | `skills/ignition-quickstart/` |
| To implement my own `TrainingEnv` | **ignition-create-env** | `skills/ignition-create-env/` |
| To choose algorithm, overrides, and a training loop | **ignition-train** | `skills/ignition-train/` |
| To separate training from greedy inference | **ignition-train-infer-split** | `skills/ignition-train-infer-split/` |
| To change rewards without silently breaking learning | **ignition-reward-shaping** | `skills/ignition-reward-shaping/` |
| To diagnose a loop that does not improve | **ignition-debug-training** | `skills/ignition-debug-training/` |
| To evaluate across seeds and report numbers | **ignition-evaluate** | `skills/ignition-evaluate/` |
| To export a trained policy to ONNX | **ignition-export-onnx** | `skills/ignition-export-onnx/` |
| To save and load weights / runner state | **ignition-save-load** | `skills/ignition-save-load/` |

The other eight skill folders land in parallel PRs. Follow this index; do not invent extra skill names.

Save/load shown in the web Quickstart (`IndexedDBProvider`, `env.save`, `env.load`) belongs to **ignition-save-load**, not this skill.

## Install this skill on an agent

Verified method (no CLI): copy this directory to the project's Agent Skills folder:

```text
.claude/skills/ignition-quickstart/SKILL.md
```

Keep the folder name equal to the frontmatter `name`. See `skills/README.md` for the full set.
