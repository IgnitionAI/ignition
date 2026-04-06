# Phase 3 — Implementation Plan

## Increments (one commit each)

### 1. Storage package skeleton
- `packages/storage/src/types.ts` — `ModelStorageProvider` interface + `ModelInfo` type
- `packages/storage/src/config.ts` — Zod schema for HF config, `HFStorageConfig` type, `parseHFConfig()` helper
- `packages/storage/package.json` — deps: `zod`, `@huggingface/hub`; peerDeps: `@tensorflow/tfjs`
- `packages/storage/tsconfig.json`
- `packages/storage/src/index.ts` + `packages/storage/index.ts`

### 2. HuggingFaceProvider
- `packages/storage/src/providers/huggingface.ts`
- Implements all 5 methods: `save`, `load`, `list`, `delete`, `exists`
- Config injected via constructor (from `parseHFConfig()` or explicit object)
- No `fs` dependency — weights serialized in-memory with `Float32Array` / `Blob`

### 3. Tests (mocked)
- `packages/storage/test/huggingface.test.ts`
- `vi.mock('@huggingface/hub', ...)` for `createRepo`, `uploadFiles`, `commit`
- `vi.mock` global `fetch` for `list`, `exists`
- Covers: save returns correct URI, load calls tf.loadLayersModel with correct URL, list parses siblings, exists returns true/false, delete commits correct operations

### 4. DQNAgent integration
- Add optional `storageProvider?: ModelStorageProvider` to `DQNConfig` (or constructor second param)
- Add `saveModel(modelId, metadata?)` and `loadModel(modelId)` methods
- Keep all existing methods untouched

### 5. Wire up
- Export `HuggingFaceProvider`, `ModelStorageProvider`, `ModelInfo`, `parseHFConfig` from `packages/storage/index.ts`
- Add `@ignitionai/storage` to `pnpm-workspace.yaml` (already covered by `packages/*` glob)
- Export storage package from `packages/backend-tfjs/src/index.ts` if desired

## Dependencies

```
packages/storage
  ├── zod ^3.x
  ├── @huggingface/hub ^1.x
  └── peerDependencies: @tensorflow/tfjs ^4.x
```

## Not in scope (this phase)
- Local filesystem provider
- S3 / GCS providers
- IndexedDB provider
- Factory / MODEL_STORAGE_PROVIDER env var switching
- PPOAgent integration (file is empty)
