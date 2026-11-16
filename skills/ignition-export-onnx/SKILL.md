---
name: ignition-export-onnx
description: Export a trained IgnitionAI TF.js policy to ONNX and serve it with OnnxAgent outside the training loop (Node, browser, Unity Sentis). Use when stopping a DQN runner, saving TF.js weights, generating the Python conversion script, converting with tensorflowjs+tf2onnx, inspecting ONNX I/O names, loading a public Hub .onnx without a token, or comparing greedy ONNX actions to TF.js.
---

# Export a policy to ONNX

Train in JavaScript with `@ignitionai/backend-tfjs`. Conversion to `.onnx` is a **separate Node + Python 3.11 step**. Serving uses `OnnxAgent` and does not train.

This skill does **not** publish to Hugging Face Hub and does **not** scaffold a Unity project. For Unity Sentis, follow the docs tutorial after you have a `.onnx` file: [Export to Unity (ONNX)](https://ignitionai.dev/docs/tutorials/onnx-unity) (source: `packages/web/content/en/tutorials/onnx-unity.mdx`).

Do not claim CartPole (or any env) has converged unless you measured returns. Export fidelity is independent of training quality.

## When to use

- A DQN policy exists and you need a portable `.onnx` graph.
- You need greedy actions in Node, the browser, or another ONNX runtime, not inside `IgnitionEnvTFJS.train()`.
- You need the exact conversion toolchain (Python packages and flags), not a guessed one-liner.

## Pipeline (do not skip stages)

1. **Train in JS** with `IgnitionEnvTFJS` + `DQNAgent`. Only DQN exposes `getModel()` for this exporter.
2. **Stop** the runner, wait behind an in-flight transition (`inferStep()`), then save TF.js JSON + weights.
3. **In Node**, register `@tensorflow/tfjs-node`, load those files, call `saveForOnnxExport`. That writes TF.js artifacts and **returns** `convert.sh` text. It does not write `convert.sh` and does not run Python.
4. **In an isolated Python 3.11 venv**, install the pinned converter stack, then run the script. Output is `.onnx` (default `<outputDir>.onnx`).
5. **Inspect** ONNX input/output names with `createOnnxSession` / `inspectSession`. Do not assume the Zod defaults (`dense_input`, `dense_3`).
6. **Serve** with `OnnxAgent` (`load()` then `getAction()`). `remember()` and `train()` are no-ops.

Details: [references/conversion.md](references/conversion.md), [references/api.md](references/api.md), [references/hub.md](references/hub.md).

## Browser: download TF.js files

Call after you are ready to freeze weights. Do not resume training while saving.

```ts
import { DQNAgent, IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';

env.stop();
await env.inferStep();
if (!(env.agent instanceof DQNAgent)) throw new Error('Expected DQN');
await env.agent.getModel().save('downloads://ignition-dqn');
```

Keep `ignition-dqn.json` and `ignition-dqn.weights.bin` together. The model object belongs to the agent; do not dispose it while the agent is in use.

## Node: `saveForOnnxExport`

```ts
import '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';
import { writeFile } from 'node:fs/promises';
import { saveForOnnxExport } from '@ignitionai/backend-onnx';

const model = await tf.loadLayersModel('file:///absolute/path/ignition-dqn.json');
const { modelDir, conversionScript } = await saveForOnnxExport(model, './export');
await writeFile(`${modelDir}/convert.sh`, conversionScript);
model.dispose();
```

`file://` handlers require `@tensorflow/tfjs-node`. `saveForOnnxExport` always saves with `file://${outputDir}`.

You can preview the bash without saving via `generateConversionScript(tfjsModelDir, savedModelDir, onnxOutputPath, opset?)`. Default opset is `13`. Non-integer or `< 1` opset throws.

## Python conversion (required; not executed by the library)

Conversion is **not** part of `pnpm test`. Install **Python 3.11** and the pinned converter stack, then point tests at that interpreter.

Preferred (uv):

```bash
uv python install 3.11
uv venv .venv-onnx --python 3.11
uv pip install --python .venv-onnx/bin/python -r packages/backend-onnx/examples/requirements-onnx.txt onnxruntime==1.16.3
export IGNITION_ONNX_PYTHON="$PWD/.venv-onnx/bin/python"
```

Equivalent without uv:

```bash
python3.11 -m venv .venv-onnx
source .venv-onnx/bin/activate
python -m pip install -r packages/backend-onnx/examples/requirements-onnx.txt onnxruntime==1.16.3
export IGNITION_ONNX_PYTHON="$PWD/.venv-onnx/bin/python"
```

Pins from `packages/backend-onnx/examples/requirements-onnx.txt` include `tensorflow==2.15.0`, `tensorflowjs==4.15.0`, `tf2onnx==1.16.1`, `numpy==1.26.4`, plus converter extras. The skill additionally pins **`onnxruntime==1.16.3`** in the venv for a Python Runtime check; Vitest comparison uses `OnnxAgent` / `onnxruntime-node`.

After Node wrote `convert.sh`:

```bash
PYTHON="$IGNITION_ONNX_PYTHON" bash ./export/convert.sh
```

The script:

- uses `PYTHON` if set, else `python`;
- TF.js Layers → Keras SavedModel (`tensorflowjs.converters.converter`, `--input_format=tfjs_layers_model`, `--output_format=keras_saved_model`);
- SavedModel → ONNX (`python -m tf2onnx.convert --saved-model … --output … --opset 13`).

It does not `pip install`. Unsupported wheels on other Python/OS combinations need another supported environment. See [references/conversion.md](references/conversion.md).

## Serve with `OnnxAgent`

```ts
import { createOnnxSession, OnnxAgent } from '@ignitionai/backend-onnx';

const session = await createOnnxSession('./export.onnx');
const inputName = session.inputNames[0];
const outputName = session.outputNames[0];
await session.release();

const agent = new OnnxAgent({
  modelPath: './export.onnx',
  actionSize: 2,
  inputName,
  outputName,
});
await agent.load();
const action = await agent.getAction(observation);
agent.dispose();
```

`getAction` always takes **argmax of Q-values** (greedy discrete). Pass `DQNAgent.getAction(obs, true)` when comparing. Continuous Q-values need a declared numeric tolerance; greedy indices must match exactly.

Runtimes:

- `createOnnxSession` from the package index uses `runtime-universal.ts` (Node: `onnxruntime-node`, browser: `onnxruntime-web`).
- `createOnnxSessionNode` is Node-only (`runtime.ts`).

`executionProviders` defaults to `['cpu']`.

## Hugging Face Hub (download only, no token)

`loadOnnxModelFromHub(repoId, filename = 'model.onnx', maxRetries = 3)` GETs the public URL `https://huggingface.co/<repoId>/resolve/main/<filename>`. There is **no token argument**. Do not put credentials in skill files or examples. Publishing is out of scope.

`OnnxAgent.loadFromHub(repoId, filename?)` downloads that buffer and creates a session.

## Fidelity check

On a **fixed** observation set, for each row:

- ONNX greedy action === TF.js greedy action;
- each Q-value: `|onnx - tfjs| <= 1e-5 + 1e-5 * |tfjs|` (absolute + relative; same as `packages/backend-tfjs/scripts/verify-onnx-export.ts`).

Declare seeds and step budget **before** running. Short training is not a performance claim.

When the venv above is present, the example test **runs** conversion for seeds 7, 13, and 29 (no skip). `it.skipIf` applies **only** if `tensorflowjs`, `tf2onnx`, and `onnxruntime` cannot be imported. A skip is not a fidelity pass.

## Pitfalls

- `saveForOnnxExport` is not ONNX export; it is TF.js save + script generation.
- Default `OnnxAgent` tensor names often do not match converted graphs — inspect first.
- `OnnxAgent.dispose()` drops the JS reference; it does not call `session.release()`.
- PPO has no `getModel()` on this API; the exporter expects a TF.js `LayersModel` (DQN).
- Q-table is not a neural net; do not send it through this pipeline.

## Executable example

`examples/skill-export-onnx.ts` plus `examples/skill-export-onnx.test.ts` (Vitest, no mocks of the framework). The probe prefers `IGNITION_ONNX_PYTHON`, then `.venv-onnx/bin/python`.
