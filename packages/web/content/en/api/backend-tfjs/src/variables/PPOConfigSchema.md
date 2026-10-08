[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / PPOConfigSchema

# Variable: PPOConfigSchema

> `const` **PPOConfigSchema**: `ZodObject`\<\{ `backend`: `ZodOptional`\<`ZodEnum`\<\[`"webgpu"`, `"webgl"`, `"cpu"`, `"wasm"`, `"node"`, `"auto"`\]\>\>; `inputSize`: `ZodNumber`; `actionSize`: `ZodNumber`; `hiddenLayers`: `ZodOptional`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>; `lr`: `ZodOptional`\<`ZodNumber`\>; `gamma`: `ZodOptional`\<`ZodNumber`\>; `gaeLambda`: `ZodOptional`\<`ZodNumber`\>; `clipRatio`: `ZodOptional`\<`ZodNumber`\>; `epochs`: `ZodOptional`\<`ZodNumber`\>; `batchSize`: `ZodOptional`\<`ZodNumber`\>; `entropyCoef`: `ZodOptional`\<`ZodNumber`\>; `valueLossCoef`: `ZodOptional`\<`ZodNumber`\>; `storageProvider`: `ZodOptional`\<`ZodAny`\>; \}, `"strip"`, `ZodTypeAny`, \{ `backend?`: `"webgpu"` \| `"webgl"` \| `"cpu"` \| `"wasm"` \| `"node"` \| `"auto"`; `inputSize`: `number`; `actionSize`: `number`; `hiddenLayers?`: `number`[]; `lr?`: `number`; `gamma?`: `number`; `gaeLambda?`: `number`; `clipRatio?`: `number`; `epochs?`: `number`; `batchSize?`: `number`; `entropyCoef?`: `number`; `valueLossCoef?`: `number`; `storageProvider?`: `any`; \}, \{ `backend?`: `"webgpu"` \| `"webgl"` \| `"cpu"` \| `"wasm"` \| `"node"` \| `"auto"`; `inputSize`: `number`; `actionSize`: `number`; `hiddenLayers?`: `number`[]; `lr?`: `number`; `gamma?`: `number`; `gaeLambda?`: `number`; `clipRatio?`: `number`; `epochs?`: `number`; `batchSize?`: `number`; `entropyCoef?`: `number`; `valueLossCoef?`: `number`; `storageProvider?`: `any`; \}\>

Defined in: [backend-tfjs/src/schemas.ts:75](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/schemas.ts#L75)
