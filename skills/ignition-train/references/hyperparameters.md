# Hyperparameters (sourced)

## `env.train` defaults

File: `packages/backend-tfjs/src/defaults.ts`

- `DQN_DEFAULTS`: `hiddenLayers [64, 64]`, `gamma 0.99`, `epsilon 1.0`, `epsilonDecay 0.995`, `minEpsilon 0.01`, `lr 0.001`, `batchSize 32`, `memorySize 10000`, `targetUpdateFrequency 100`
- `PPO_DEFAULTS`: `hiddenLayers [64, 64]`, `gamma 0.99`, `gaeLambda 0.95`, `clipRatio 0.2`, `lr 3e-4`, `epochs 4`, `batchSize 64`, `entropyCoef 0.01`, `valueLossCoef 0.5`
- `QTABLE_DEFAULTS`: `stateBins 10`, `gamma 0.99`, `epsilon 1.0`, `epsilonDecay 0.995`, `minEpsilon 0.01`, `lr 0.1`
- `'double-dqn'` copies DQN defaults and sets `doubleQ: true`

Merge: `packages/core/src/defaults.ts` `mergeDefaults` (shallow; arrays replaced).

## Runner

File: `packages/core/src/ignition-env.ts`

- `train(algorithm?, overrides?)` — default algorithm `'dqn'`
- `stop()` — cancel future ticks
- `setSpeed(multiplier)` — `≤1` → 50 ms / 1 step; `≤10` → 10 ms / `round(multiplier)` steps; else 1 ms / `round(multiplier / 2)` steps
- `step()` / `inferStep()` — one serialized transition (`greedy` true on infer)

## Networks and trainer helper

- `packages/backend-tfjs/src/model/BuildMLP.ts` — `buildQNetwork(inputSize, outputSize, hiddenLayers = [24, 24], lr = 0.001, seed?)` for DQN
- `packages/backend-tfjs/src/agents/ppo.ts` — local tanh `buildMLP` for actor and critic
- `packages/backend-tfjs/src/tools/trainer.ts` — `trainAgent({ config, maxSteps, getEnvStep, ... })` DQN-only helper

## Schemas

`packages/backend-tfjs/src/schemas.ts`: `DQNConfigSchema`, `PPOConfigSchema`, `QTableConfigSchema`.
