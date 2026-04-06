# Phase 3 — Task Checklist

## Increment 1 — Storage package skeleton
- [x] Create `packages/storage/src/types.ts`
- [x] Create `packages/storage/src/config.ts`
- [x] Create `packages/storage/package.json`
- [x] Create `packages/storage/tsconfig.json`
- [x] Create `packages/storage/src/index.ts`
- [x] Create `packages/storage/index.ts`

## Increment 2 — HuggingFaceProvider
- [x] Create `packages/storage/src/providers/huggingface.ts`
- [x] Implement `save()`
- [x] Implement `load()`
- [x] Implement `list()`
- [x] Implement `delete()`
- [x] Implement `exists()`

## Increment 3 — Tests
- [x] Create `packages/storage/test/huggingface.test.ts`
- [x] Mock `@huggingface/hub`
- [x] Mock global `fetch`
- [x] Mock `tf.loadLayersModel`
- [x] Tests: save, load, list, delete, exists

## Increment 4 — DQNAgent integration
- [x] Add `storageProvider?` field to `DQNConfig` (or constructor param)
- [x] Add `saveModel()` method to `DQNAgent`
- [x] Add `loadModel()` method to `DQNAgent`

## Increment 5 — Wire up
- [x] Export from `packages/storage/index.ts`
- [x] `pnpm test` passes
- [x] Commit + push to `origin/feature/core-refacto`
