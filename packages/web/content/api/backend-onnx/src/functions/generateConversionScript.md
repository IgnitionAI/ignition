[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / generateConversionScript

# Function: generateConversionScript()

> **generateConversionScript**(`tfjsModelDir`, `savedModelDir`, `onnxOutputPath`, `opset?`): `string`

Defined in: [backend-onnx/src/exporter.ts:51](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-onnx/src/exporter.ts#L51)

Generates the bash conversion script without saving the model.
Useful when you want to preview the commands or use a pre-saved model.

## Parameters

### tfjsModelDir

`string`

Directory containing TF.js model.json

### savedModelDir

`string`

Intermediate TF SavedModel output directory

### onnxOutputPath

`string`

Final .onnx output path

### opset?

`number` = `13`

## Returns

`string`
