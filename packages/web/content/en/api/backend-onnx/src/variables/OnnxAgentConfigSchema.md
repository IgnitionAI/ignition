[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / OnnxAgentConfigSchema

# Variable: OnnxAgentConfigSchema

> `const` **OnnxAgentConfigSchema**: `ZodObject`\<\{ `modelPath`: `ZodUnion`\<\[`ZodString`, `ZodType`\<`Buffer`\<`ArrayBufferLike`\>, `ZodTypeDef`, `Buffer`\<`ArrayBufferLike`\>\>, `ZodType`\<`Uint8Array`\<`ArrayBuffer`\>, `ZodTypeDef`, `Uint8Array`\<`ArrayBuffer`\>\>\]\>; `actionSize`: `ZodNumber`; `executionProviders`: `ZodDefault`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `inputName`: `ZodDefault`\<`ZodString`\>; `outputName`: `ZodDefault`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `modelPath`: `string` \| `Uint8Array`\<`ArrayBuffer`\> \| `Buffer`\<`ArrayBufferLike`\>; `actionSize`: `number`; `executionProviders`: `string`[]; `inputName`: `string`; `outputName`: `string`; \}, \{ `modelPath`: `string` \| `Uint8Array`\<`ArrayBuffer`\> \| `Buffer`\<`ArrayBufferLike`\>; `actionSize`: `number`; `executionProviders?`: `string`[]; `inputName?`: `string`; `outputName?`: `string`; \}\>

Defined in: [backend-onnx/src/types.ts:3](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/types.ts#L3)
