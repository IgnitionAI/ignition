# Double DQN serialized runner round-trip

Verified on 2026-10-04 using the TFJS CPU backend.

The existing public API test now persists TensorFlow.js ModelArtifacts and loads a distinct model through `IgnitionEnv.load()`. It verifies that trained weights survive loading, greedy inference chooses the same action, and inference leaves loaded weights unchanged. Metadata identifies Double DQN even when caller metadata supplies an incorrect algorithm label. Existing injected fit-failure cleanup coverage remains.

Commands:

```sh
corepack pnpm exec vitest run packages/backend-tfjs/test/double-dqn-api.test.ts packages/backend-tfjs/test/double-dqn.test.ts packages/backend-tfjs/test/dqn-export.test.ts
corepack pnpm exec tsc --noEmit --target ES2022 --module commonjs --moduleResolution node --esModuleInterop --strict --skipLibCheck packages/backend-tfjs/test/double-dqn-api.test.ts
```

Result: four tests passed; strict TypeScript check passed. The mathematical tests exercise distinct online selection and target evaluation through public loading/training APIs, covering DQN and Double DQN.

Scope: local in-memory serialized artifacts, not a remote provider, IndexedDB transport or restoration of optimizer/replay-buffer state. Circuit UI acceptance and issue dependencies remain separate requirements. No production algorithm was changed.
