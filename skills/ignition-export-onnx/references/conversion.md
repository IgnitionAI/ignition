# Conversion toolchain (exact)

`saveForOnnxExport` and `generateConversionScript` live in `packages/backend-onnx/src/exporter.ts`. They never execute Python.

## Python environment

- Interpreter: **Python 3.11** in an isolated venv.
- Requirements file: `packages/backend-onnx/examples/requirements-onnx.txt`.
- Pins (install the whole file, not a subset):

```
tensorflow==2.15.0
tensorflowjs==4.15.0
tf2onnx==1.16.1
numpy==1.26.4
tensorflow-decision-forests==1.8.1
tensorflow-hub==0.15.0
flax==0.7.5
jax==0.4.19
jaxlib==0.4.19
orbax-checkpoint==0.3.5
tensorstore==0.1.45
optax==0.1.7
chex==0.1.7
scipy==1.11.4
setuptools==80.9.0
```

TensorFlow.js imports the extra converter packages even for Layers models. Other Python versions or unpinned `pip install tensorflowjs tf2onnx` are not this project's tested path.

## Commands

Install Python 3.11 if needed (`uv python install 3.11`, `pyenv install 3.11`, or the distro `python3.11` package). Then:

```bash
uv venv .venv-onnx --python 3.11
uv pip install --python .venv-onnx/bin/python -r packages/backend-onnx/examples/requirements-onnx.txt onnxruntime==1.16.3
export IGNITION_ONNX_PYTHON="$PWD/.venv-onnx/bin/python"
# After Node wrote convert.sh next to the TF.js files:
PYTHON="$IGNITION_ONNX_PYTHON" bash ./export/convert.sh
```

Without uv:

```bash
python3.11 -m venv .venv-onnx
source .venv-onnx/bin/activate
python -m pip install -r packages/backend-onnx/examples/requirements-onnx.txt onnxruntime==1.16.3
```

Do not commit `.venv-onnx`. The example test discovers that interpreter via `IGNITION_ONNX_PYTHON` or `.venv-onnx/bin/python`.

Override the converter script interpreter with `PYTHON`. Extra pin for this skill (not in the package requirements file): `onnxruntime==1.16.3`.

## What the generated script runs

1. `python -c 'from tensorflowjs.converters.converter import pip_main; pip_main()'` with `--input_format=tfjs_layers_model --output_format=keras_saved_model <dir>/model.json <dir>_savedmodel`
2. `python -m tf2onnx.convert --saved-model <dir>_savedmodel --output <onnx> --opset <n>`

Default ONNX path is `<outputDir>.onnx` (not inside `outputDir`). Default opset is 13.

## Node packaging (standalone consumers)

See `packages/backend-onnx/examples/README.md` and `packages/backend-onnx/examples/export-downloaded.ts`. Reproduction of conversion verification in this repo uses `packages/backend-tfjs/scripts/verify-onnx-export.ts` (not part of `vitest`).

## Out of scope

- Building or running a Unity project (tutorial only: `/docs/tutorials/onnx-unity`).
- Publishing the `.onnx` file to the Hub.
