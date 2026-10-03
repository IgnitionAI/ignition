# Browser training → Node export → Python conversion

Use `download-dqn.ts` in your browser app. Bind `startTraining()` and
`downloadPolicy()` to buttons. Download only after convergence, and do not
restart training until the download finishes. It waits behind any already
running transition with a final greedy step, then uses `DQNAgent.getModel()`.
Keep `ignition-dqn.json` and `ignition-dqn.weights.bin` together.

The model returned by `getModel()` belongs to the agent. Do not dispose it or
replace its weights while the runner is active. `saveForOnnxExport` runs in
Node, registers no file handler itself, and returns script text rather than
executing conversion.

In a standalone Node project, copy `export-downloaded.ts` and the requirements
file, install the dependencies, and bundle the example:

```bash
pnpm add @ignitionai/backend-onnx @tensorflow/tfjs @tensorflow/tfjs-node onnxruntime-node
pnpm add -D esbuild typescript @types/node
pnpm exec esbuild export-downloaded.ts --bundle --platform=node --format=cjs --external:@tensorflow/tfjs-node --external:@tensorflow/tfjs --external:onnxruntime-node --external:onnxruntime-web --outfile=export-downloaded.cjs
node export-downloaded.cjs /absolute/path/ignition-dqn.json ./export
```

The Node example loads the downloaded model using `tfjs-node`'s `file://`
handler, writes TF.js JSON/weights to `./export`, and explicitly writes
`./export/convert.sh` from the returned text.

Set up a separate Python 3.11 environment and run the script:

```bash
python3.11 -m venv .venv-onnx
source .venv-onnx/bin/activate
python -m pip install -r requirements-onnx.txt
bash ./export/convert.sh
```

The generated script does not install packages. It uses `python` from your
environment, or the executable supplied through `PYTHON`. The conversion is
TF.js Layers → TensorFlow SavedModel → ONNX. The default output is
`./export.onnx`. Unsupported Python/platform wheels require another supported
environment; conversion is not part of browser training.

Before using `OnnxAgent`, inspect the converted input/output names and pass
them explicitly. The exporter does not guarantee the defaults `input`/`output`:

```ts
import { createOnnxSession, OnnxAgent } from '@ignitionai/backend-onnx';

const session = await createOnnxSession('./export.onnx');
const inputName = session.inputNames[0];
const outputName = session.outputNames[0];
await session.release();
const policy = new OnnxAgent({ modelPath: './export.onnx', actionSize: 2, inputName, outputName });
await policy.load();
const action = await policy.getAction([0, 0, 0, 0]);
```

## Reproduce conversion verification in this repository

After `corepack pnpm install --frozen-lockfile`, build the framework packages,
then use the Python environment configured above. Run from the repository root:

```bash
corepack pnpm --filter @ignitionai/core --filter @ignitionai/storage --filter @ignitionai/backend-tfjs --filter @ignitionai/environments --filter @ignitionai/backend-onnx run build
corepack pnpm exec tsc -p packages/backend-onnx/examples/tsconfig.json
corepack pnpm --filter @ignitionai/backend-onnx exec esbuild ../backend-tfjs/scripts/verify-onnx-export.ts --bundle --platform=node --format=cjs '--external:@tensorflow/*' '--external:onnxruntime*' --alias:@ignitionai/backend-onnx=./dist/index.js --alias:@ignitionai/environments=../environments/dist/index.js --outfile=node_modules/.cache/issue19-verify.cjs
NODE_PATH="$PWD/packages/backend-tfjs/node_modules:$PWD/packages/backend-onnx/node_modules" PYTHON=/absolute/path/.venv-onnx/bin/python node packages/backend-onnx/node_modules/.cache/issue19-verify.cjs /tmp/ignition-onnx-proof
```

This separate runtime check bundles the built public framework entry points,
trains DQN for 64 CartPole transitions, executes the generated Python script,
and compares all Q-values and greedy actions on three fixed observations with
ONNX Runtime. The tolerance is `1e-5 + 1e-5 * abs(TF.js value)`. A successful
run writes `report.json`, `convert.sh`, the TF.js files, the intermediate
SavedModel and the ONNX model to the requested directory. It verifies conversion
fidelity, not CartPole convergence or deployment in Unity.
