# Continuous actions: source API

This API is additive in the current source checkout. It is not a claim that the published 0.1.0 packages contain SAC. Build the workspace packages before importing from their package names.

`ContinuousRunner` comes from `@ignitionai/core`; `SACAgent` and the `SACConfig`/`SACSnapshot` types come from `@ignitionai/backend-tfjs`. Continuous actions use their own runner. The discrete `AlgorithmType` and `IgnitionEnvTFJS` configuration do not accept `sac`.

## Environment boundary

Implement `ContinuousTrainingEnv` with a nonempty one-dimensional `BoxSpace` and these methods:

- `observe(): number[]`: fixed-width finite observations.
- `step(action: number[]): void`: apply one bounded vector action.
- `reward(): number`: finite reward for the last transition.
- `terminated(): boolean`: true for a terminal state; SAC suppresses bootstrap.
- `truncated(): boolean`: true for an external episode limit; SAC retains bootstrap.
- `reset(): void`: start the next episode.

The runner captures the final observation before resetting an episode. It snapshots action bounds and copies observations/transitions. Invalid dimensions, nonfinite values and out-of-bounds actions are rejected rather than silently clipped. SAC additionally requires bounds representable as distinct finite float32 values.

## Manual execution

The checked-in `PointMassEnv` is a runnable reference implementation, with observations `[position, velocity]` and acceleration bounded to `[-2, 2]`.

```ts
import * as tf from '@tensorflow/tfjs';
import { ContinuousRunner } from '@ignitionai/core';
import { SACAgent } from '@ignitionai/backend-tfjs';
import { PointMassEnv } from '../../packages/backend-tfjs/examples/continuous/point-mass';

await tf.setBackend('cpu');
await tf.ready();
const env = new PointMassEnv(11);
const agent = new SACAgent({ inputSize: 2, actionSpace: env.actionSpace, seed: 11 });
const runner = new ContinuousRunner(env, agent);
try {
  for (let interaction = 0; interaction < 20000; interaction++) await runner.step();
  await runner.stop();
  await runner.reset();
  for (let tick = 0; tick < 100; tick++) await runner.inferStep();
} finally {
  await runner.stop();
  agent.dispose();
}
```

`step()` collects a transition and asks the agent to train; a gradient update follows the configured warmup/cadence. `inferStep()` runs the greedy policy without replay insertion, training or RNG advancement. Calls are serialized. Automatic `train()`/`infer()` schedule ticks at `stepIntervalMs`; inspect `lastError` if execution stops after an error. Await `stop()` to drain an active transition before loading or disposing. The runner does not own agent disposal. `reset()` resets the environment, not the policy.

## Checkpoints

After stopping execution, serialize `agent.exportCheckpoint()` as JSON. Restore with `agent.loadCheckpoint(parsedValue)` into an agent with the same architecture, settings, observation width and action bounds. Loading validates all five networks before assigning weights and rejects incompatible versions or malformed/nonfinite weights. The format identifies `algorithm: 'sac'` and `version: 'sac-v1'`.

The snapshot contains actor, two critics, two targets, settings, bounds, counters and RNG. Loading creates fresh optimizers and empties replay. It preserves greedy inference; it does not reproduce an uninterrupted training trajectory. An application must separately identify its environment/observation/action contract: equal dimensions alone do not establish semantic compatibility. The browser reference wraps snapshots with `environment: 'point-mass-v1'` and rejects other identities.

## Defaults and evidence

Fixed temperature `alpha=0.05`, hidden layers `[32,32]`, learning rate `0.0003`, discount `0.99`, Polyak interpolation `0.005`, batch `64`, replay `10000`, warmup `500`, and one update per two collected interactions. Temperature adaptation is not implemented.

See [the complete plan](continuous-sac.md), [the frozen five-seed protocol](sac-point-mass-protocol-v1.json), [retained verification](../verification/continuous/README.md), and [the runnable demo instructions](../../packages/backend-tfjs/examples/continuous/README.md). A successful build or a short demo evaluation does not establish the full benchmark threshold.
