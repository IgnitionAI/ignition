# Symptom table (IgnitionRL on `dev` SHA `343a76952f9dcd6594674c3526ee03ee45b4d93e`)

Signatures are cited as `file:line` in the pull request. This file only names the symbols.

## Flat reward

- **Cause:** `TrainingEnv.reward()` ignores the task, or `done()` is always true so CartPole returns `0`.
- **Check:** Drive 20 `env.step()` calls. If every `StepResult.reward` is identical, the environment has no learning signal. CartPole itself returns `1` while the pole is up and `0` when `done()` is true.
- **Fix:** Change **your** `reward()` / `done()`. Do not expect a framework logger.

## NaN / Inf

- **Cause:** `DQNConfig.lr` far above `0.001`; observations with huge magnitude; a tensor leak feeding garbage into `predict`.
- **Check:** After the budget, probe Q-values with `DQNAgent.getModel()` inside `tf.tidy`. Also test `Number.isFinite` on every `StepResult.reward` and observation component.
- **Fix:** `lr: 0.001` (`DQN_DEFAULTS`). Scale observations. Keep probes in `tf.tidy`.

## Instability

- **Cause:** Large `lr`; tiny `targetUpdateFrequency` (or huge, so the target never moves); training before the replay buffer has `batchSize` samples (`DQNAgent.train` returns early).
- **Check:** Read `getState().trainStepCounter` — it only increases when `memory.size() >= batchSize`. Compare mean returns across three seeds; high variance plus non-finite Q is instability, not “almost learned”.
- **Fix:** Defaults in `DQN_DEFAULTS`: `lr: 0.001`, `targetUpdateFrequency: 100`, `batchSize: 32` (example uses `8` only to stay under 60 s CPU).

## Forgetting

- **Cause:** Replay overwriting early successes; epsilon already at `minEpsilon` so the policy is greedy on a weak Q; CartPole’s 500-step cap reported as `terminated` via `done()`, so DQN treats timeout as a true terminal (`q = reward` with no bootstrap).
- **Check:** Split the budget into early/late mean returns. Read `epsilon`. Confirm `truncated` is always `false` on stock CartPole (`IgnitionEnv` sets `truncated = env.truncated?.() ?? false`).
- **Fix:** In a **custom** env, implement `truncated()` for time limits. Slow `epsilonDecay` (default `0.995`). This skill cannot change `CartPoleEnv`.

## Policy collapse

- **Cause:** PPO `entropyCoef` too small (default `0.01`); DQN `epsilon` decayed to `minEpsilon` before the Q-network is useful.
- **Check:** Count chosen actions over the budget. Do **not** print “entropy” — PPO computes it inside `train()` and does not return it. DQN has no entropy term.
- **Fix:** Raise `entropyCoef` for PPO. For DQN, start at `epsilon: 1` and decay slowly.

## DQN epsilon mis-set

- **Cause:** `epsilon: 0` (no exploration) or `epsilonDecay: 1` with `epsilon: 1` (pure random forever).
- **Check:** `DQNAgent.getState().epsilon` after N **trained** steps (warmup does not decay epsilon because `train()` returns before the decay).
- **Fix:** `epsilon: 1.0`, `epsilonDecay: 0.995`, `minEpsilon: 0.01`.

## Unnormalized observations

- **Cause:** `CartPoleEnv.observe()` returns raw physics: cart `x` in about `[-2.4, 2.4]`, `theta` in radians (~`±0.209` at failure), velocities unbounded. The root README asks for `[-1, 1]`.
- **Check:** Min/max per dimension over 50 steps. If you wrap `observe()` with `× 1e3`, Q-values often become non-finite under the same `lr`.
- **Fix:** Divide each dim by a known scale (e.g. `x / 2.4`, `theta / 0.209`) in **your** wrapper.

## Learning rate too high

- **Cause:** Override `lr: 0.1` or `1` on `env.train('dqn', { lr })`. Default is `0.001`.
- **Check:** Same seeds, only `lr` changes. Non-finite Q or mean return stuck at random is a failed run, not a maybe.
- **Fix:** Drop the override or set `lr: 0.001`.

## Tensor leaks

- **Cause:** Calling `model.predict` without `tf.tidy` / `tf.dispose`; never calling `DQNAgent.dispose()`.
- **Check:** After warmup, `const n = tf.memory().numTensors`; run N `env.step()`; `tf.memory().numTensors === n`.
- **Fix:** Copy the agent pattern: tidy the graph, dispose fit inputs, dispose the agent when finished.

## Backend selection

- **Cause:** `backend: 'auto'` in `setBackend` is a no-op. Requesting `webgpu` in Node falls back to CPU with a console warning.
- **Check:** `getAvailableBackends()` then `tf.getBackend()` after `await tf.ready()`.
- **Fix:** Node tests: `backend: 'cpu'`. Browser: try `webgpu`, then `webgl`, then `wasm`, then `cpu`.

## Gaps in the package (report, do not patch here)

1. No training-loss or entropy metric on `getState()`.
2. `bestReward` on DQN/PPO is unused by the normal `train()` path.
3. `CartPoleEnv.reset()` is unseeded; agent `seed` does not control physics.
4. CartPole time limit is `done() === true` without `truncated()`.
5. `setBackend('auto')` does not select a backend.
6. `DQNAgent` does not `await` `setBackend`.
