[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / generateConversionScript

# Function: generateConversionScript()

> **generateConversionScript**(`tfjsModelDir`, `savedModelDir`, `onnxOutputPath`, `opset?`): `string`

Defined in: [backend-onnx/src/exporter.ts:79](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/exporter.ts#L79)

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
