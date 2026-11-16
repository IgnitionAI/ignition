---
name: ignition-train
description: Choose DQN, PPO, or Q-Table, configure hyperparameters, then start and stop IgnitionEnv training. Use when picking an algorithm from action and observation size, calling train/stop/setSpeed, overriding defaults, or running a measured training budget.
---

# Train an IgnitionRL agent

Use this skill to pick an algorithm that **this `dev` SHA actually runs**, configure it, start the loop, and stop it. Do not claim the agent converged unless you measured returns against a declared budget and seeds.

## Choose an algorithm

`IgnitionEnv.train(algorithm, overrides)` accepts `AlgorithmType`: `'dqn' | 'double-dqn' | 'ppo' | 'qtable'`. Observation size is `observe().length`. Action size is `actions.length` or the numeric `actions` count. PPO on this SHA samples a **discrete** categorical action (`PPOAgent.getAction` returns a single index). Continuous PPO is not on this SHA.

| Observation | Actions | Use | Why |
|---|---|---|---|
| Small enumerable state (grid cells, few bins per dim, table size `stateBins ** obsDim` stays tractable) | Discrete | `qtable` | Tabular update, no network |
| Vector obs, discrete actions (default) | Discrete | `dqn` | Replay + target net; also `'double-dqn'` |
| Vector obs, discrete actions, on-policy / stability | Discrete | `ppo` | Clipped categorical policy; needs a full rollout before `shouldTrain()` |
| Box / continuous actions | Continuous | **unsupported here** | Not in this SHA |

Q-Table bins every observation dim. Default `stateBins` is 10, so 4D obs → 10⁴ cells. Pass `stateLow` / `stateHigh` when obs are not in `[0, 1]`.

## Start, speed, stop

```ts
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { GridWorldEnv } from '@ignitionai/environments';

const env = new IgnitionEnvTFJS(new GridWorldEnv(5));
env.setSpeed(10);                 // 1x default, 10x fast, >10 turbo
env.train('qtable', { stateBins: 5, lr: 0.3 });
// ... later
env.stop();
```

- `train()` with no algorithm uses `'dqn'`. It creates the agent, then `start()` (timer loop).
- Same algorithm again **without** overrides resumes. Same algorithm **with** overrides throws; create a new runner.
- Switching algorithm replaces the agent (previous `dispose` waits on an in-flight transition).
- `stop()` clears the timer and bumps a generation id so later ticks return. A transition already inside `performStep` may still finish. After that, no further automatic steps.
- `setSpeed(multiplier)` changes `stepIntervalMs` / `stepsPerTick` only (not learning rate).
- Manual `step()` / `inferStep()` work after `stop()`. They share the same serialized transition queue.

`packages/backend-tfjs/src/tools/trainer.ts` `trainAgent` is a separate DQN checkpoint loop. Prefer `IgnitionEnv` for env-driven training.

## Defaults (`env.train`) vs constructing an agent

`train()` merges `ALGORITHM_DEFAULTS` then `{ ...overrides, inputSize, actionSize }`. Cite **`defaults.ts`**, not constructor fallbacks:

| Key | DQN / double-dqn | PPO | Q-Table |
|---|---|---|---|
| `hiddenLayers` | `[64, 64]` | `[64, 64]` | — |
| `lr` | `0.001` | `3e-4` | `0.1` |
| `gamma` | `0.99` | `0.99` | `0.99` |
| `epsilon` / decay / min | `1.0` / `0.995` / `0.01` | — | `1.0` / `0.995` / `0.01` |
| `batchSize` | `32` | `64` | — |
| `memorySize` | `10000` | — | — |
| `targetUpdateFrequency` | `100` | — | — |
| `gaeLambda` / `clipRatio` / `epochs` | — | `0.95` / `0.2` / `4` | — |
| `entropyCoef` / `valueLossCoef` | — | `0.01` / `0.5` | — |
| `stateBins` | — | — | `10` |
| extra | `double-dqn` sets `doubleQ: true` | `rolloutSize` default **128** in `shouldTrain` (not in `defaults.ts`) | `stateLow`/`stateHigh` default `[0,1]` per dim |

Direct `new DQNAgent(...)` uses constructor fallbacks `hiddenLayers: [24, 24]` and `targetUpdateFrequency: 1000` if you omit those keys — different from `env.train('dqn')`. `buildQNetwork` (DQN MLP, ReLU, linear Q-head) also defaults to `[24, 24]`. PPO builds a separate tanh MLP in `ppo.ts`, not `BuildMLP.ts`.

Schemas: `DQNConfigSchema`, `PPOConfigSchema`, `QTableConfigSchema`. DQN-only optional `seed` (1…1e6). Q-Table has **no** `seed` field — seed `Math.random` around a run if you need repeatable exploration.

## Measured GridWorld + Q-Table

Do this **before** any `step()`:

1. Write seeds (≥ 3) and budget (episodes and/or transitions, eval episodes, max steps).
2. Train each seed with `train('qtable', …)` then `stop()`, then a **fixed** number of `step()` calls (or episode loop).
3. Evaluate greedy (`inferStep`) vs a random policy on the **same seeds**.
4. Compare **measured** mean returns. Paste raw per-seed numbers. Do not say “it converged” if you only watched the loop.

Runnable code: `examples/skill-train.ts`. Tests: `examples/skill-train.test.ts` and `skills/ignition-train/skill-train.test.ts`.

## More detail

- Algorithm choice and PPO discrete-only note: [references/algorithm-choice.md](references/algorithm-choice.md)
- Hyperparameters and file pointers: [references/hyperparameters.md](references/hyperparameters.md)
