[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / createOnnxSessionNode

# Function: createOnnxSessionNode()

> **createOnnxSessionNode**(`model`, `executionProviders?`): `Promise`\<`InferenceSession`\>

Defined in: [backend-onnx/src/runtime.ts:10](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/runtime.ts#L10)

Creates an ONNX InferenceSession from a model path or buffer.
Uses onnxruntime-node in Node.js environments.

## Parameters

### model

`string` \| `Buffer`\<`ArrayBufferLike`\> \| `Uint8Array`\<`ArrayBufferLike`\>

### executionProviders?

`string`[] = `...`

## Returns

`Promise`\<`InferenceSession`\>
