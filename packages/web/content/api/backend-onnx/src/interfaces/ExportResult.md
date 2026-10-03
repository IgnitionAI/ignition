[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / ExportResult

# Interface: ExportResult

Defined in: [backend-onnx/src/exporter.ts:13](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-onnx/src/exporter.ts#L13)

Node-only export: register @tensorflow/tfjs-node before using file:// saving.
Browser callers first download the TF.js JSON and weight files with
dqnAgent.getModel().save('downloads://ignition-dqn'), then load them in Node.
The generated script converts TF.js Layers → TensorFlow SavedModel → ONNX.
Set up an isolated Python 3.11 environment with examples/requirements-onnx.txt
before running it. saveForOnnxExport returns script text; it does not write
convert.sh or execute Python.

## Properties

### modelDir

> **modelDir**: `string`

Defined in: [backend-onnx/src/exporter.ts:15](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-onnx/src/exporter.ts#L15)

Directory where the TF.js model was saved (model.json + weights.bin)

***

### conversionScript

> **conversionScript**: `string`

Defined in: [backend-onnx/src/exporter.ts:17](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-onnx/src/exporter.ts#L17)

Shell script (bash) that converts the saved model to .onnx
