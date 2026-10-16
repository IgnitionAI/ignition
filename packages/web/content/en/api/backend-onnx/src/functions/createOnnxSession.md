[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / createOnnxSession

# Function: createOnnxSession()

> **createOnnxSession**(`model`, `executionProviders?`): `Promise`\<`InferenceSession`\>

Defined in: [backend-onnx/src/runtime-universal.ts:26](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/runtime-universal.ts#L26)

Creates an ONNX InferenceSession from a model path, Buffer, Uint8Array, or ArrayBuffer.
Auto-detects Node vs browser and loads the appropriate runtime.

## Parameters

### model

`string` \| `ArrayBuffer` \| `Buffer`\<`ArrayBufferLike`\> \| `Uint8Array`\<`ArrayBufferLike`\>

### executionProviders?

`string`[] = `...`

## Returns

`Promise`\<`InferenceSession`\>
