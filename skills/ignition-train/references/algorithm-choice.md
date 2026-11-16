# Algorithm choice (`@ignitionai/*` 0.1.0)

Action size is `typeof env.actions === 'number' ? env.actions : env.actions.length`. Input size is the first `observe()` vector length (`IgnitionEnv` constructor / `train()`).

## What each factory builds

`IgnitionEnvTFJS` registers:

- `dqn` → `DQNAgent`
- `double-dqn` → `DQNAgent` with `doubleQ: true`
- `ppo` → `PPOAgent` (softmax over `actionSize`, `sampleCategorical`)
- `qtable` → `QTableAgent` (epsilon-greedy table)

PPO `getAction` always returns one integer in `0 … actionSize-1`. There is no Gaussian / box action head in 0.1.0.

## Table size check for Q-Table

Approximate cells: `(stateBins ?? 10) ** inputSize`. Schema rejects encodings that exceed `Number.MAX_SAFE_INTEGER`. If `stateBins ** inputSize` is huge, use DQN instead.

GridWorld (`GridWorldEnv`): 4 named discrete actions, observation `[agentRow, agentCol, targetRow, targetCol]` each in `[0, 1]`. Target is fixed, so Q-Table still works if `stateBins` is at least the grid size.

## Docs vs code

The algorithm pages describe defaults and intuition. Prefer `defaults.ts` + agent sources when they disagree (for example Q-Table `epsilon` decays on every `train()` update, not once per episode; PPO docs mention continuous control that 0.1.0 does not implement).
