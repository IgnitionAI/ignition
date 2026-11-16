# Storage providers and Hub IO

## LocalStorageProvider

Browser (or Node with a declared `localStorage` + `window` + `document` polyfill imported **before** TF.js).

- `save` → `model.save('localstorage://' + modelId)` then optional metadata at `ignition:meta:<modelId>`
- `load` → `tf.loadLayersModel('localstorage://' + modelId)` — returns the network, not metadata
- Models larger than about 5MB typically fail the quota

## IndexedDBProvider

Same metadata prefix in `localStorage`. Weights use `indexeddb://`. `delete()` only removes metadata; TF.js does not expose IndexedDB deletion here.

## DownloadProvider

`save` uses `downloads://` and may also download `<id>-metadata.json`. `load()` always throws. `list()` is empty; `exists()` is false; `delete()` is a no-op.

## HuggingFaceProvider

Constructor: explicit `{ token, repoId }` or `parseHFConfig()` which reads **`HF_TOKEN`** and **`HF_REPO_ID`**.

Validation (Zod):

- token non-empty and `startsWith('hf_')`
- repoId matches `owner/repo`

`save` uploads `<modelId>/model.json`, `weights.bin`, and optional `metadata.json` via `@huggingface/hub`. `load` retries `tf.loadLayersModel('https://huggingface.co/<repo>/resolve/main/<modelId>/model.json')`.

Do not put token values in skills, examples, tests, or PRs. This skill does not call the live Hub. Package coverage uses mocks (`packages/storage/test/huggingface.test.ts`).

## saveModelToHub / loadModelFromHub

`saveModelToHub` is Node-only (`fs`, `path`, `@tensorflow/tfjs-node`, `./tmp-model/<subdir>`). DQN loads it with a dynamic import so browser bundles do not pull `tfjs-node`.

`loadModelFromHub` is the HTTP loader in `packages/backend-tfjs/src/io/loadModel.ts` (exported name `loadModelFromHub`, not `loadModel`).

Checkpoint folders on Hub from DQN helpers:

- `saveToHub`: `${modelName}_${checkpointName}` (defaults `model_last`)
- `saveCheckpoint` / `loadCheckpoint`: `model_${checkpointName}/model.json`
- `maybeSaveBestCheckpoint`: `step-${step}` or `best` when reward improves
