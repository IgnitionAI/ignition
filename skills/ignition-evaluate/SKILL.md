---
name: ignition-evaluate
description: Evaluate a frozen IgnitionRL policy with held-out seeds, multiple episodes, mean ± sample std or a 95% CI, a random baseline, and a declared compute budget. Use before reporting returns, comparing agents, or claiming that a policy improved.
---

# Evaluate a frozen policy

Measure a **fixed** policy. Do not report a single seed, a single episode, or a number without a spread. Do not claim convergence unless you measured it against a declared budget.

This skill uses only the public `@ignitionai/*` **0.1.0** API.

## When to use

- After training, before export, or when comparing two checkpoints.
- When a user asks “how good is this agent?” or wants a leaderboard-style number.
- When you need a random-policy baseline on the same evaluation seeds.

## Hard rules

1. **Greedy, no learning.** Call `agent.getAction(observation, true)`. On `IgnitionEnv`, `inferStep()` is the greedy path: it does not `remember` or `train`. Never evaluate with `step()` / `train()` — those write the replay buffer and update weights (DQN also decays epsilon inside `train()`).
2. **Hold out eval seeds.** List training seeds and evaluation seeds **before** the run. They must be disjoint. Use at least three evaluation seeds.
3. **Several episodes.** For each eval seed, run `N` episodes. Report the vector of episode returns, then mean ± sample standard deviation (Bessel, `n-1`) or a 95% CI (`mean ± 1.96 * s / sqrt(n)`).
4. **Random baseline.** Run a seeded uniform-random policy on the **same** env seeds and episode count. Report `policy mean − random mean`. Do not treat a positive gap as solved.
5. **Budget first.** Write max env steps (and wall clock if you use one) before the first `getAction`. Paste raw returns, including failures. If the budget ends first, say so.
6. **No silent CartPole seeding.** `CartPoleEnv` has no seed argument; `reset()` uses `Math.random()`. For reproducibility, write the public `state` field from a seeded RNG (see the example), or wrap the env. Do not “fix” `packages/environments` in this skill’s PR.

## Workflow

### 1. Declare protocol (before any step)

```ts
const TRAIN_SEEDS = [11, 29, 47] as const;      // never used at eval time
const EVAL_SEEDS = [101, 202, 303] as const;    // held-out, ≥ 3
const EPISODES_PER_SEED = 3;
const MAX_STEPS_PER_EPISODE = 500;              // CartPole done() cap
```

Copy this block into the report before you run anything.

### 2. Freeze the policy

Create or load the agent, then evaluate **only** with `greedy === true`.

```ts
import { DQNAgent } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';

const agent = new DQNAgent({
  inputSize: 4,
  actionSize: 2,
  hiddenLayers: [8],
  backend: 'cpu',
  seed: 11,
});

const action = await agent.getAction(env.observe(), true); // greedy
```

To prove the policy stayed frozen, snapshot `DQNAgent.getModel().getWeights()` and `getState()` (`epsilon`, `trainStepCounter`, `bestReward`) before and after. They must match.

`IgnitionEnv.inferStep()` is equivalent for a single transition: `performStep(true)` skips `remember` / `train`. Do **not** rely on it for seeded CartPole episodes: a terminal `inferStep` calls `env.reset()`, which is unseeded.

### 3. Run `evaluate(agent, envFactory, seeds, episodes)`

There is **no** public `evaluate()` on `@ignitionai/*` 0.1.0. Use the helper in `examples/skill-evaluate.ts` (or copy it). That helper is not part of the published packages.

```ts
import {
  evaluateWithRandomBaseline,
  formatEvaluationReport,
  seededCartPoleFactory,
  EVAL_SEEDS,
  EPISODES_PER_SEED,
} from './examples/skill-evaluate';

const report = await evaluateWithRandomBaseline(
  agent,
  seededCartPoleFactory,
  EVAL_SEEDS,
  EPISODES_PER_SEED,
);
console.log(formatEvaluationReport(report));
```

`envFactory(seed)` must return a **new** env whose initial state is a deterministic function of `seed`. The helper derives per-episode seeds so `reset()` is never required for reproducibility.

### 4. Fill the report template

See [references/report-template.md](references/report-template.md). Required fields: train seeds, eval seeds, episodes per seed, budget, raw returns, mean ± sample std, 95% CI, random baseline, and an explicit “no convergence claimed” line unless you have a separate measured criterion.

## CartPole specifics (this API)

- Actions: `['push_left', 'push_right']`.
- Observation: `[x, xDot, theta, thetaDot]`.
- `reward()` is `0` when `done()`, else `1`. Sum rewards **after** each `step`.
- `done()` is true when `|theta| > 12°`, `|x| > 2.4`, or `stepCount >= 500`. There is no `truncated()`; the 500-step cap is treated as terminal by `IgnitionEnv`.

## What not to do

- Do not average only the last episode, or only the best seed.
- Do not evaluate with epsilon-greedy (`getAction(obs)` / `getAction(obs, false)`).
- Do not change package code to add seeding; report the gap.
- Do not paste internal hostnames, tokens, or machine paths into the skill or reports.

## Executable example

- Helper: `examples/skill-evaluate.ts`
- Tests: `examples/skill-evaluate.test.ts` (real CartPole + DQN, no mocks)
