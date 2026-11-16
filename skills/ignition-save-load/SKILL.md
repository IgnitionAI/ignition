---
name: ignition-save-load
description: Save, version, and reload IgnitionRL agents (DQN, PPO, Q-table) with LocalStorage, IndexedDB, download, or Hugging Face providers. Use when checkpointing weights, resuming epsilon or train-step state, or loading a model for inference. Does not train from scratch or export ONNX.
---

# Save, version, and reload an Ignition agent

Use this skill to persist a trained agent and reload it in a **new** runner for more training or greedy inference. It covers `IgnitionEnv.save` / `load`, agent `save` / `load` / `getState` / `setState`, the four storage providers, Hub helpers, and checkpoint names.

API surface is `dev` at SHA `343a76952f9dcd6594674c3526ee03ee45b4d93e` only.

## When to use

- You already have an agent from `env.train(...)` and need a checkpoint.
- You want to resume later without resetting epsilon / train counters.
- You want greedy actions from a saved network in a fresh process.

Do **not** use this skill to create an env, shape rewards, or convert to ONNX.

## Node: declare a localStorage polyfill first

`LocalStorageProvider` and `IndexedDBProvider` call TensorFlow.js IO schemes (`localstorage://`, `indexeddb://`). Those handlers register only when `window` and `document` exist **before** `@tensorflow/tfjs` loads.

In Node, import a declared polyfill before storage or TF.js (see `examples/skill-save-load-polyfill.ts`). Do not skip this and mock the provider instead.

## Wire a provider at agent creation

DQN and PPO persist through `storageProvider` on the config passed to `train()`. Without it, `save()` throws.

```ts
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';
import { LocalStorageProvider } from '@ignitionai/storage';

const storage = new LocalStorageProvider();
const env = new IgnitionEnvTFJS(new CartPoleEnv());
env.train('dqn', { backend: 'cpu', seed: 7, storageProvider: storage });
env.stop(); // train() starts the automatic loop; stop before manual save
```

The umbrella package `ignitionai` re-exports `HuggingFaceProvider` only. Import `LocalStorageProvider`, `IndexedDBProvider`, and `DownloadProvider` from `@ignitionai/storage`.

Q-table `save` / `load` write JSON under `ignition:qtable:<modelId>` in `localStorage` and ignore `storageProvider`.

## Save and load through IgnitionEnv

```ts
const modelId = 'cartpole-dqn-v1';
const uri = await env.save(modelId);
await env.load(modelId);
```

`IgnitionEnv.save` merges `algorithm`, `stepCount`, `agent.getState()`, then caller `metadata` into the object passed to `agent.save`.

`IgnitionEnv.load` calls `agent.load(modelId)` and then **sets `env.stepCount = 0`**. It does **not** call `setState`. Treat resume as a two-step protocol (below).

## Agent persistence

| Algorithm | `save` / `load` | `getState` fields |
|---|---|---|
| DQN | `storageProvider.save/load` on the Q-network | `epsilon`, `trainStepCounter`, `bestReward` |
| PPO | actor at `<id>/actor`, critic at `<id>/critic` | `trainStepCounter`, `bestReward` (load also drops the rollout) |
| Q-table | JSON in `localStorage` | `epsilon` (restored inside `load`) |

After a DQN/PPO `load`, weights come from the provider; exploration counters do not, unless you call `setState`.

## Resume protocol (required extra step)

1. Train, then `const state = agent.getState()`.
2. `await env.save(modelId)` — LocalStorageProvider also stores that metadata at `localStorage['ignition:meta:' + modelId]` (prefix not exported).
3. New `IgnitionEnvTFJS` + `train('dqn', { ...same architecture, storageProvider })` + `stop()`.
4. `await env.load(modelId)` — weights replaced; epsilon still at its constructor default.
5. `agent.setState(JSON.parse(localStorage.getItem('ignition:meta:' + modelId)))`.
6. If you need the env step counter, re-assign it yourself. `load` cleared it.

Greedy identity: `agent.getAction(observation, true)` on a **fixed** observation, not a freshly reset CartPole sample.

Executable proof: `examples/skill-save-load.ts` (`roundTripLocalCheckpoint`).

## Checkpoint names

Use opaque string ids. Suggested pattern:

- Release: `<name>-v<n>` (`cartpole-dqn-v1`)
- Periodic: `<name>-step-<k>` (`cartpole-dqn-step-1000`)
- Best so far: `<name>-best`

DQN Hub helpers use a different folder layout (`model_${checkpointName}` / `modelName_checkpointName`). Stay consistent within one backend. Do not overwrite `...-v1` when the policy changed; bump the version.

Helpers: `versionedCheckpoint`, `stepCheckpoint` in `examples/skill-save-load.ts`.

## Providers

| Provider | `save` | `load` | Notes |
|---|---|---|---|
| `LocalStorageProvider` | `localstorage://<id>` | yes | Browser; Node with declared polyfill. Quota ~5MB. |
| `IndexedDBProvider` | `indexeddb://<id>` | yes | Larger models. Metadata still in `localStorage`. `delete` only clears metadata. |
| `DownloadProvider` | `downloads://<id>` | throws | Write-only browser download. |
| `HuggingFaceProvider` | `hf://<repo>/<id>` | HTTP GET of `model.json` | Needs `HF_TOKEN` + `HF_REPO_ID`. |

`parseHFConfig()` reads `HF_TOKEN` (must start with `hf_`) and `HF_REPO_ID` (`owner/repo`). Document the variable **names** only. Never commit values.

This skill does **not** issue real Hub requests. Existing package tests mock `@huggingface/hub` and `fetch`.

## Hub IO helpers (Node)

- `saveModelToHub(model, repo, token, subdir?)` writes `./tmp-model/<subdir>` then uploads. Pulls `tfjs-node` and `fs` — browser-unsafe. DQN wraps it in a dynamic import (`saveToHub`, `saveCheckpoint`, `maybeSaveBestCheckpoint`).
- `loadModelFromHub(repoId, filename?, graphModel?, maxRetries?, initialDelay?)` GETs `https://huggingface.co/<repo>/resolve/main/<filename>` with retries.

Prefer `HuggingFaceProvider` + `storageProvider` for the ModelStorageProvider path. Use the IO helpers only when you already have a `tf.LayersModel` and a Hub repo.

## Inference after load

```ts
await env.load(modelId);
if (env.agent) env.agent.setState(/* metadata */);
env.infer();           // automatic greedy loop
await env.inferStep(); // one greedy env step
await env.agent.getAction(obs, true);
```

## Gaps (do not patch packages in this skill)

1. `IgnitionEnv.load` zeros `stepCount` and never calls `setState`.
2. DQN/PPO `load` replaces networks only; Q-table `load` does restore epsilon.
3. `ModelStorageProvider.load` returns a model, not metadata. Resume must read `ignition:meta:<id>` or keep a companion JSON.
4. `ignitionai` does not re-export the three local providers.
5. `saveModelToHub` custom `weights.bin` may not match TF.js Layers weight manifests Hub-side; prefer provider `model.save` artifacts when in doubt.

## References

- `references/signatures.md` — every used signature with `file:line`
- `references/providers.md` — provider and Hub details
- `examples/skill-save-load.ts` — measured local round-trip
