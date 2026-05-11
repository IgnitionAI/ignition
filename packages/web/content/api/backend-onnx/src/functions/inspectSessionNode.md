[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / inspectSessionNode

# Function: inspectSessionNode()

> **inspectSessionNode**(`session`): `object`

Defined in: [backend-onnx/src/runtime.ts:54](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/runtime.ts#L54)

Returns the list of input/output tensor names for a session.
Useful for debugging when the tensor names are unknown.

## Parameters

### session

`InferenceSession`

## Returns

`object`

### inputs

> **inputs**: `string`[]

### outputs

> **outputs**: `string`[]
