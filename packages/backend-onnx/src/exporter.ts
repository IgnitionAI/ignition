import * as path from 'path';

/**
 * Node-only export: register @tensorflow/tfjs-node before using file:// saving.
 * Browser callers first download the TF.js JSON and weight files with
 * dqnAgent.getModel().save('downloads://ignition-dqn'), then load them in Node.
 * The generated script converts TF.js Layers → TensorFlow SavedModel → ONNX.
 * Set up an isolated Python 3.11 environment with examples/requirements-onnx.txt
 * before running it. saveForOnnxExport returns script text; it does not write
 * convert.sh or execute Python.
 */

export interface ExportResult {
  /** Directory where the TF.js model was saved (model.json + weights.bin) */
  modelDir: string;
  /** Shell script (bash) that converts the saved model to .onnx */
  conversionScript: string;
}

/**
 * Saves a TF.js LayersModel to `outputDir` and returns the Python conversion script.
 *
 * @param model     - A TF.js `tf.LayersModel` (e.g. `dqnAgent.getModel()`)
 * @param outputDir - Directory path where the TF.js model will be saved
 * @param onnxOutputPath - Desired output path for the final .onnx file (default: `<outputDir>.onnx`)
 */
export async function saveForOnnxExport(
  model: { save: (url: string) => Promise<unknown> },
  outputDir: string,
  onnxOutputPath?: string,
  opset = 13,
): Promise<ExportResult> {
  const resolvedDir = path.resolve(outputDir);
  const savedModelDir = resolvedDir + '_savedmodel';
  const onnxPath = onnxOutputPath ?? resolvedDir + '.onnx';

  const conversionScript = generateConversionScript(resolvedDir, savedModelDir, onnxPath, opset);
  await model.save(`file://${resolvedDir}`);

  return { modelDir: resolvedDir, conversionScript };
}

/**
 * Generates the bash conversion script without saving the model.
 * Useful when you want to preview the commands or use a pre-saved model.
 *
 * @param tfjsModelDir    - Directory containing TF.js model.json
 * @param savedModelDir   - Intermediate TF SavedModel output directory
 * @param onnxOutputPath  - Final .onnx output path
 */
export function generateConversionScript(
  tfjsModelDir: string,
  savedModelDir: string,
  onnxOutputPath: string,
  opset = 13,
): string {
  if (!Number.isInteger(opset) || opset < 1) {
    throw new Error('[ONNX] opset must be a positive integer.');
  }
  const quote = (value: string): string => "'" + value.replace(/'/g, "'\\''") + "'";
  return `#!/bin/bash
# IgnitionAI — TF.js Layers to ONNX. Activate the Python environment first.
# Install examples/requirements-onnx.txt in that environment before running.
set -euo pipefail

TFJS_MODEL_DIR=${quote(tfjsModelDir)}
SAVED_MODEL_DIR=${quote(savedModelDir)}
ONNX_OUTPUT=${quote(onnxOutputPath)}
PYTHON="\${PYTHON:-python}"
mkdir -p "$SAVED_MODEL_DIR"

"$PYTHON" -c 'from tensorflowjs.converters.converter import pip_main; pip_main()' \\
  --input_format=tfjs_layers_model --output_format=keras_saved_model \\
  "$TFJS_MODEL_DIR/model.json" "$SAVED_MODEL_DIR"

"$PYTHON" -m tf2onnx.convert \\
  --saved-model "$SAVED_MODEL_DIR" \\
  --output "$ONNX_OUTPUT" \\
  --opset ${opset}
printf 'ONNX model saved to: %s\\n' "$ONNX_OUTPUT"
`;
}
