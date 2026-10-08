[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / runInferenceNode

# Function: runInferenceNode()

> **runInferenceNode**(`session`, `inputData`, `inputShape`, `inputName`, `outputName`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [backend-onnx/src/runtime.ts:30](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/runtime.ts#L30)

Runs a forward pass through an ONNX session.

## Parameters

### session

`InferenceSession`

Active InferenceSession

### inputData

`Float32Array`

Flat Float32Array of the input tensor

### inputShape

`number`[]

Shape of the input tensor (e.g. [1, 4] for batch of 1, 4 features)

### inputName

`string`

ONNX graph input tensor name

### outputName

`string`

ONNX graph output tensor name

## Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Flat Float32Array of the output tensor (e.g. Q-values)
