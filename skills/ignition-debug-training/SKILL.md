---
name: ignition-debug-training
description: Diagnose an IgnitionRL training run that is not learning. Use when reward is flat, values are NaN, training is unstable, the policy forgets or collapses, DQN epsilon is wrong, observations are unscaled, the learning rate is too high, TensorFlow.js tensors leak, or the TF.js backend is mis-selected. Start from a symptom, pick a cause, run a check that can falsify it, then change one thing and re-measure.
---

# Debug a training run that does not learn

Work from a **symptom**, pick a **cause**, run a **check that can fail**, then apply **one** change and re-measure. Do not claim the agent learned unless you recorded returns. Declare **budget** (step count, network size) and **seeds** (at least three) before any run.

Executable protocol: `examples/skill-debug-training.ts` (test: `examples/skill-debug-training.test.ts`).

Full symptom table: [references/symptom-table.md](references/symptom-table.md).

## Metrics this API actually exposes

Record only these. If a number is not in this list, compute it yourself from `StepResult` or say it is missing.

| What you can read | Where |
|---|---|
| Per-step `reward`, `observation`, `terminated`, `truncated` | `IgnitionEnv.step()` → `StepResult` |
| Steps taken since last `reset()` | `IgnitionEnv.stepCount` |
| Automatic-loop failure | `IgnitionEnv.lastError` |
| DQN `epsilon`, `trainStepCounter` | `DQNAgent.getState()` |
| PPO `trainStepCounter` | `PPOAgent.getState()` |
| Q-table `epsilon` | `QTableAgent.currentEpsilon` |
| Q-values (not a training metric; you must probe) | `DQNAgent.getModel().predict(...)` |
| Live tensor count | `tf.memory().numTensors` |
| Active TF.js backend | `tf.getBackend()` after `setBackend` |

**Not exposed** (do not invent them): training loss, policy entropy, explained variance, gradient norms, mean Q as a logger, episode return as a framework field. `DQNAgent.getState().bestReward` exists but is updated only by `maybeSaveBestCheckpoint`, not by `train()`. PPO computes entropy inside `train()` and never returns it.

Episode return is the sum of `StepResult.reward` from reset until `terminated || truncated`. Mean return over a budget is the number you compare across seeds.

## Procedure

1. **Stop the timer loop.** `train()` starts an automatic loop (`IgnitionEnv.train` → `start`). Call `stop()` and drive `await env.step()` yourself so counts are exact.
2. **Write the protocol first.** Example: seeds `[7, 11, 19]`, `TRAIN_STEPS = 64`, `hiddenLayers: [8]`, `batchSize: 8`, `backend: 'cpu'`. Then run. Paste raw JSON, including failures.
3. **One hypothesis per run.** Change learning rate *or* epsilon *or* observation scaling, not all three.
4. **Falsify.** If Q-values stay finite with `lr: 1`, the “LR too high → NaN” story is false for that budget; pick another row in the table.
5. **Fix and re-measure** on the same seeds and budget. Report both sides.

CartPole physics: `CartPoleEnv` (`packages/environments/src/cartpole.ts`). Reward is `1` while up, `0` on `done()`. `observe()` is **not** scaled to `[-1, 1]`. `reset()` uses `Math.random()` (not the agent `seed`). For a fair comparison, wrap the env and write `state` from your own RNG after `reset()` (the example does this). `done()` treats the 500-step cap as a terminal failure; there is no `truncated()`.

## Symptom → cause → check → fix

Use this abbreviated map. Details and citations: [references/symptom-table.md](references/symptom-table.md).

| Symptom | Likely cause | Check that decides | Fix |
|---|---|---|---|
| Reward always 0 or constant | `reward()` ignores the task; or always `done()` | Print `reward` and `terminated` for 20 random actions | Return a shaped signal; fix `done()` |
| `reward` or Q-values are `NaN`/`Inf` | `lr` too large; exploding obs; leaked tensors corrupting math | `Number.isFinite` on rewards and a `tf.tidy` Q probe | Lower `lr` (DQN default `0.001`); scale `observe()`; wrap graphs in `tf.tidy` |
| Unstable returns (wild swings) | `lr` high; target net too slow/fast; no replay warmup | Compare `lr: 1` vs `lr: 0.001` on 3 seeds; read `trainStepCounter` | Use `DQN_DEFAULTS.lr`; `targetUpdateFrequency: 100` |
| Late collapse / “forgetting” | Off-policy overwrite; epsilon already at `minEpsilon`; CartPole cap marked `terminated` | Plot mean return by slice of the budget; read `epsilon` from `getState()` | Slow `epsilonDecay`; treat time-limit as `truncated` in **your** env (CartPole does not) |
| Policy collapse (one action) | PPO entropy too small; DQN greedy too early | Histogram of actions during `step()` (not entropy: not logged) | Raise `PPOConfig.entropyCoef` (default `0.01`); keep `epsilon` from decaying to 0 instantly |
| DQN never exploits / never explores | `epsilon = 1` and `epsilonDecay = 1`; or `epsilon = 0` | `getState().epsilon` after N trained steps | Defaults: `epsilon: 1`, `epsilonDecay: 0.995`, `minEpsilon: 0.01` |
| Learns in notebook, fails in game | Observations not normalized; scale mismatch vs training | Print min/max of each `observe()` dim over 50 steps | Scale each dim toward `[-1, 1]` as the root README recommends |
| `lr` “too strong” | Default is already `0.001`; `lr >= 1` is **rejected** by `DQNConfigSchema`; `0.1`–`0.99` is legal but aggressive | Catch the schema error, or compare legal `lr` values on 3 seeds | Remove the override or set `lr: 0.001` |
| Memory grows / browser tab dies | Missing `tf.tidy` / `tf.dispose`; `getAction` tensors not disposed | `tf.memory().numTensors` before vs after N `step()`s | Agents already tidy `train()` and dispose `getAction` tensors; **your** `predict` probes must be in `tf.tidy`. Call `dispose()` when replacing an agent |
| Silent CPU fallback / slow train | `setBackend('webgpu')` unavailable; `backend: 'auto'` does nothing | `getAvailableBackends()` then `tf.getBackend()` | Pass `backend: 'cpu'` in Node tests; `'webgl'`/`'webgpu'` only after they appear in the registry |

## TensorFlow.js hygiene

- `DQNAgent.train` builds the Bellman batch inside `tf.tidy` and `tf.dispose`s the fit tensors in `finally`.
- `DQNAgent.getAction` disposes `stateTensor`, `qValues`, and `argMaxTensor`.
- `PPOAgent.train` wraps gradient work in `tf.tidy`.
- After warmup (replay at `batchSize`), `tf.memory().numTensors` must stay **flat** across N further `env.step()` calls. If it climbs, the leak is in **your** probe code or a custom env, until proven otherwise.
- Replacing an agent: `IgnitionEnv` disposes the previous agent asynchronously after `train()` with a new algorithm. For tests, call `env.stop(); env.agent?.dispose?.()`.

## Backend choice

`setBackend` in `packages/backend-tfjs/src/utils/backend-selector.ts`:

- `'auto'` **returns immediately** and does not pick a backend.
- `'node'` `require`s `@tensorflow/tfjs-node` and falls back to CPU if missing.
- `'wasm'` same pattern with `@tensorflow/tfjs-backend-wasm`.
- Other names: `tf.setBackend(name)`, CPU on failure.
- `getAvailableBackends()` lists `engine().registryFactory` keys.

Call `await tf.setBackend('cpu'); await tf.ready();` in Node before `train()`, matching package tests. `DQNAgent` fires `setBackend(config.backend)` without awaiting it.

## CartPole failure used by the example

Shared budget (all protocols): seeds `7`, `11`, `19`; `64` steps; `hiddenLayers: [8]`; `batchSize: 8`; `memorySize: 64`; `targetUpdateFrequency: 100`; `backend: 'cpu'`.

| Protocol | Declared before the run | Measured result |
|---|---|---|
| A | `lr: 1` vs `0.001` | Schema rejects `lr >= 1`. No training. |
| B | observe × `1000` vs × `1`, `lr: 0.001` | Q stayed finite (seed 7 ≈ `[79.4, 104.6]`). Hypothesis false at this budget. |
| C | `lr: 0.99` vs `0.001` | Q stayed finite on 3 seeds. Hypothesis false at this budget. |
| D | `reward() === 0` vs `CartPoleEnv.reward()` | Broken mean return is 0; restored reward has mean return > 0. Not a CartPole solve. |

## Do not

- Do not use APIs from unmerged PRs.
- Do not mock `IgnitionEnvTFJS`, `DQNAgent`, or `CartPoleEnv`.
- Do not skip a failing seed.
- Do not “fix” `@ignitionai/*` in this skill’s PR. Report gaps instead.
