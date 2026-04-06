# Phase 3 — Model Persistence for IgnitionAI

## Vision

Model storage is abstracted behind a common interface (`ModelStorageProvider`), making it easy to swap providers later (S3, GCS, local FS, IndexedDB) without touching agent code. For now, only the Hugging Face Hub provider is implemented.

## Interface

```typescript
interface ModelInfo {
  modelId: string;
  uri: string;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

interface ModelStorageProvider {
  save(modelId: string, model: tf.LayersModel, metadata?: Record<string, unknown>): Promise<string>;  // returns URI
  load(modelId: string): Promise<tf.LayersModel>;
  list(): Promise<ModelInfo[]>;
  delete(modelId: string): Promise<void>;
  exists(modelId: string): Promise<boolean>;
}
```

## Providers

| Provider      | Status        | Description                              |
|---------------|---------------|------------------------------------------|
| `huggingface` | ✅ Implemented | Hugging Face Hub via `@huggingface/hub`  |
| `local`       | 🔜 Planned    | Node.js filesystem                       |
| `s3`          | 🔜 Planned    | AWS S3 / MinIO / Cloudflare R2           |
| `gcs`         | 🔜 Planned    | Google Cloud Storage                     |
| `indexeddb`   | 🔜 Planned    | Browser IndexedDB                        |

## Hugging Face Provider

### Config (via environment variables)

```
HF_TOKEN=hf_xxxx         # Hugging Face access token (required)
HF_REPO_ID=user/repo     # Target repository ID (required)
```

### Behaviour

- `save(modelId, model)` — serializes weights + architecture, uploads `{modelId}/model.json` and `{modelId}/weights.bin` to the repo. Creates the repo if it doesn't exist. Returns `hf://{repoId}/{modelId}`.
- `load(modelId)` — loads via `tf.loadLayersModel` from `https://huggingface.co/{repoId}/resolve/main/{modelId}/model.json` with exponential-backoff retry.
- `list()` — hits `GET /api/models/{repoId}`, parses `siblings` to find unique directories containing `model.json`.
- `delete(modelId)` — commits a delete operation for `{modelId}/model.json` and `{modelId}/weights.bin`.
- `exists(modelId)` — HEAD request to the model.json URL.

### Config validation

Zod schema in `packages/storage/src/config.ts` validates `HF_TOKEN` and `HF_REPO_ID` at construction time, throwing a descriptive error if either is missing or malformed.

## Package structure

```
packages/storage/
├── src/
│   ├── types.ts               # ModelStorageProvider, ModelInfo
│   ├── config.ts              # Zod schema + HFStorageConfig type
│   ├── providers/
│   │   └── huggingface.ts     # HuggingFaceProvider
│   └── index.ts
├── test/
│   └── huggingface.test.ts    # Vitest, mocked HTTP/HF SDK
├── index.ts
├── package.json
└── tsconfig.json
```

## Agent integration

`DQNAgent` optionally accepts a `ModelStorageProvider` in its constructor. Two new methods are added:

```typescript
saveModel(modelId: string, metadata?: Record<string, unknown>): Promise<string>
loadModel(modelId: string): Promise<void>
```

Existing `saveToHub` / `loadFromHub` / checkpoint methods remain for backwards compatibility.
