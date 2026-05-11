[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / QTableConfigSchema

# Variable: QTableConfigSchema

> `const` **QTableConfigSchema**: `ZodObject`\<\{ `backend`: `ZodOptional`\<`ZodEnum`\<\[`"webgpu"`, `"webgl"`, `"cpu"`, `"wasm"`, `"node"`, `"auto"`\]\>\>; `inputSize`: `ZodNumber`; `actionSize`: `ZodNumber`; `stateBins`: `ZodOptional`\<`ZodNumber`\>; `stateLow`: `ZodOptional`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>; `stateHigh`: `ZodOptional`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>; `lr`: `ZodOptional`\<`ZodNumber`\>; `gamma`: `ZodOptional`\<`ZodNumber`\>; `epsilon`: `ZodOptional`\<`ZodNumber`\>; `epsilonDecay`: `ZodOptional`\<`ZodNumber`\>; `minEpsilon`: `ZodOptional`\<`ZodNumber`\>; `storageProvider`: `ZodOptional`\<`ZodAny`\>; \}, `"strip"`, `ZodTypeAny`, \{ `backend?`: `"webgpu"` \| `"webgl"` \| `"cpu"` \| `"wasm"` \| `"node"` \| `"auto"`; `inputSize`: `number`; `actionSize`: `number`; `stateBins?`: `number`; `stateLow?`: `number`[]; `stateHigh?`: `number`[]; `lr?`: `number`; `gamma?`: `number`; `epsilon?`: `number`; `epsilonDecay?`: `number`; `minEpsilon?`: `number`; `storageProvider?`: `any`; \}, \{ `backend?`: `"webgpu"` \| `"webgl"` \| `"cpu"` \| `"wasm"` \| `"node"` \| `"auto"`; `inputSize`: `number`; `actionSize`: `number`; `stateBins?`: `number`; `stateLow?`: `number`[]; `stateHigh?`: `number`[]; `lr?`: `number`; `gamma?`: `number`; `epsilon?`: `number`; `epsilonDecay?`: `number`; `minEpsilon?`: `number`; `storageProvider?`: `any`; \}\>

Defined in: [backend-tfjs/src/schemas.ts:133](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/schemas.ts#L133)
