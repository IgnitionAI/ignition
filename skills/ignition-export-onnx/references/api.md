# API used from `@ignitionai/*` 0.1.0

Citations are `file:line` in that tree. Do not use unpublished APIs.

## Exporter — `packages/backend-onnx/src/exporter.ts`

- `ExportResult` — `13:18`
- `saveForOnnxExport(model, outputDir, onnxOutputPath?, opset = 13)` — `27:41`
- `generateConversionScript(tfjsModelDir, savedModelDir, onnxOutputPath, opset = 13)` — `51:82`

## OnnxAgent — `packages/backend-onnx/src/agents/onnx-agent.ts`

- class `OnnxAgent` — `20:94`
- `constructor(config)` / Zod parse — `24:26`
- `load()` — `32:37`
- `getAction(observation)` (argmax, always greedy) — `44:61`
- `remember` / `train` no-ops — `63:67`
- `inspect()` — `73:78`
- `loadFromHub(repoId, filename?)` — `85:88`
- `dispose()` — `91:93`

## Config — `packages/backend-onnx/src/types.ts`

- `OnnxAgentConfigSchema` — `3:14` (`modelPath`, `actionSize`, `executionProviders` default `['cpu']`, `inputName` default `'dense_input'`, `outputName` default `'dense_3'`)

## Node runtime — `packages/backend-onnx/src/runtime.ts`

- `createOnnxSession` — `10:19`
- `runInference` — `30:48`
- `inspectSession` — `54:59`

## Universal runtime — `packages/backend-onnx/src/runtime-universal.ts`

- `createOnnxSession` — `26:44`
- `runInference` — `55:73`
- `inspectSession` — `78:83`

The package index re-exports the **universal** trio as `createOnnxSession`, `runInference`, `inspectSession`, and the Node trio as `createOnnxSessionNode`, `runInferenceNode`, `inspectSessionNode` (`packages/backend-onnx/src/index.ts` `1:8`).

## Hub download — `packages/backend-onnx/src/io/loadOnnxFromHub.ts`

- `loadOnnxModelFromHub` — `24:54` (public HTTPS, no token)

## Training side (DQN only for this export)

- `IgnitionEnvTFJS` — `packages/backend-tfjs/src/ignition-env-tfjs.ts` `26:32`
- `IgnitionEnv.train` / `step` / `inferStep` / `stop` — `packages/core/src/ignition-env.ts` `41:71`, `73:79`, `147:152`
- `DQNAgent.getAction(state, greedy?)` — `packages/backend-tfjs/src/agents/dqn.ts` `76:89`
- `DQNAgent.getModel()` — `packages/backend-tfjs/src/agents/dqn.ts` `96:98`
- `CartPoleEnv` — `packages/environments/src/cartpole.ts` `23:29`

Facade re-exports: `packages/ignitionai/src/index.ts` `45:52`.
