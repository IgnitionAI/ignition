[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / loadOnnxModelFromHub

# Function: loadOnnxModelFromHub()

> **loadOnnxModelFromHub**(`repoId`, `filename?`, `maxRetries?`): `Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

Defined in: [backend-onnx/src/io/loadOnnxFromHub.ts:24](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/io/loadOnnxFromHub.ts#L24)

Downloads a .onnx file from HF Hub and returns it as a Buffer.
The Buffer can be passed directly to OnnxAgent as `modelPath`.

## Parameters

### repoId

`string`

HF Hub repo (e.g. "salim4n/my-dqn-model")

### filename?

`string` = `'model.onnx'`

Filename in the repo (default: "model.onnx")

### maxRetries?

`number` = `3`

Number of retry attempts on failure (default: 3)

## Returns

`Promise`\<`Buffer`\<`ArrayBufferLike`\>\>
