[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / saveForOnnxExport

# Function: saveForOnnxExport()

> **saveForOnnxExport**(`model`, `outputDir`, `onnxOutputPath?`, `opset?`): `Promise`\<[`ExportResult`](../interfaces/ExportResult.md)\>

Defined in: [backend-onnx/src/exporter.ts:27](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-onnx/src/exporter.ts#L27)

Saves a TF.js LayersModel to `outputDir` and returns the Python conversion script.

## Parameters

### model

A TF.js `tf.LayersModel` (e.g. `dqnAgent.getModel()`)

#### save

(`url`) => `Promise`\<`unknown`\>

### outputDir

`string`

Directory path where the TF.js model will be saved

### onnxOutputPath?

`string`

Desired output path for the final .onnx file (default: `<outputDir>.onnx`)

### opset?

`number` = `13`

## Returns

`Promise`\<[`ExportResult`](../interfaces/ExportResult.md)\>
