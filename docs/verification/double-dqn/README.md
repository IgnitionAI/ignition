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

## Circuit browser acceptance

On the local production preview at http://127.0.0.1:3102/demos/car-circuit, selected DQN then Double DQN using the public method selector. Started actual Double DQN training (seed 11), stopped, saved without evaluation, reloaded the page and loaded the saved driver from the garage. The retained UI reports 7,500 transitions and 1,868 updates. These are training counts, not evidence of successful driving. Reload restored the Double DQN method and sample count; no page errors were observed during save/reload capture. The UI explicitly says the optimizer is recreated on resumption. Browser evidence is in browser-reload.json.

Sibling DQN, auto-configuration, load/memory, truncation and target-cadence tests also passed; exact test results are in dqn-sibling-tests.json. The deliberate default-frequency change in issue #25 remains documented and is not an accidental Double DQN behavior change.

Screenshots were displayed during verification. This preview uses the previously built demo assets; subsequent changes touched tests/documentation only. No deployed release, successful race, full evaluation of this saved pilot or authenticated remote storage is claimed. Issue #11 remains open pending its Circuit dependency #9 and final criterion reconciliation.
