---
name: ignition-train-infer-split
description: Use when splitting IgnitionRL training from frozen-policy inference — train() then infer()/inferStep()/getAction(obs, greedy), save/load into a new runner or process, keep the React Three Fiber render loop off the training loop, or dispose tensors after a headless artefact. Not for ONNX export or remote providers.
---

# Split training and inference

Train until you have weights worth freezing. Then run a **greedy** policy on a
separate loop, runner, or process. Do not keep calling `step()` (training) while
you believe you are serving a frozen policy.

## When to use

- A policy must stop learning (browser demo, second process, later session).
- R3F `useFrame` is dropping frames because training ran inside the render loop.
- You need identical greedy actions after `save` / `load` on a new `IgnitionEnvTFJS`.
- You need tensor cleanup via `agent.dispose()` measured with `tf.memory()`.

## Hard split

| Mode | Public entry | Learns? | Action selection |
|---|---|---|---|
| Train | `train()` then automatic ticks, or manual `step()` | Yes (`remember` + `agent.train`) | `getAction(obs, false)` (ε-greedy for DQN) |
| Infer | `infer()` automatic ticks, or manual `inferStep()` | No | `getAction(obs, true)` |
| Direct | `agent.getAction(obs, greedy)` | No, unless you also `remember`/`train` | Caller chooses `greedy` |

`inferStep()` is the one-step freeze: it requests a greedy action and **skips**
`remember` / `agent.train` (`packages/core/src/ignition-env.ts:77-101`).
`infer()` starts the same greedy path on the `setTimeout` loop (`:111-114`).

`IgnitionEnv` has **no** `dispose()`. Stop the loop, then dispose the agent:

```ts
runner.stop();
runner.agent?.dispose?.();
```

## Headless train → artefact → new instance

1. `new IgnitionEnvTFJS(world)` then `train('dqn', { backend: 'cpu', storageProvider, seed })`.
2. Call `stop()` immediately if you will drive steps yourself (`train()` starts the timer).
3. Budgeted `step()` calls. Do not claim return improvement unless you measure it.
4. `save(modelId)` — requires `storageProvider` on the DQN config.
5. New `IgnitionEnvTFJS`, `train(...)` to build a same-shaped agent, `stop()`, `load(modelId)`.
6. Compare `getAction(obs, true)` on a **fixed** observation set.
7. `dispose()` and compare `tf.memory().numTensors`.

Overrides apply only at agent creation. Resuming the same algorithm with
overrides throws (`ignition-env.ts:44-47`).

Executable protocol: `examples/skill-train-infer-split.ts` (seeds `11, 23, 47`).

## R3F: two loops, one env

Keep `train()` / `infer()` **outside** `useFrame`. The Canvas only **reads** env
fields. Shared mutable state on the `TrainingEnv` is the bridge; JavaScript is
single-threaded so the timers never overlap. Cleanup with `stop()` on unmount.
Details: `references/r3f-loop-split.md`.

## Signatures (`@ignitionai/*` 0.1.0)

See `references/api.md` for `file:line` citations.

## Common mistakes

| Mistake | What actually happens |
|---|---|
| Leave `train()` running while “demoing” | Weights keep changing; ε-greedy still explores |
| `getAction(obs)` without `true` | DQN may explore (`dqn.ts:76-78`) |
| `load()` on an empty runner | Throws: agent must exist (`ignition-env.ts:201-204`) |
| Expect `load()` to restore ε | DQN `load` replaces weights only (`dqn.ts:251-253`) |
| `runner.dispose()` | Does not exist; use `stop()` + `agent.dispose?.()` |
| Mutate physics in `useFrame` | Render loop becomes the env; training sees a different world |
| ONNX / Hugging Face in this skill | Out of scope (other skills) |

## Out of scope

`@ignitionai/viz`, ONNX (`OnnxAgent`), remote checkpoints, changing package code.
