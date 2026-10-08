[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / ExperienceSchema

# Variable: ExperienceSchema

> `const` **ExperienceSchema**: `ZodObject`\<\{ `state`: `ZodArray`\<`ZodNumber`, `"many"`\>; `action`: `ZodUnion`\<\[`ZodNumber`, `ZodArray`\<`ZodNumber`, `"many"`\>\]\>; `reward`: `ZodNumber`; `nextState`: `ZodArray`\<`ZodNumber`, `"many"`\>; `terminated`: `ZodBoolean`; `truncated`: `ZodBoolean`; `info`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `state`: `number`[]; `action`: `number` \| `number`[]; `reward`: `number`; `nextState`: `number`[]; `terminated`: `boolean`; `truncated`: `boolean`; `info?`: `Record`\<`string`, `unknown`\>; \}, \{ `state`: `number`[]; `action`: `number` \| `number`[]; `reward`: `number`; `nextState`: `number`[]; `terminated`: `boolean`; `truncated`: `boolean`; `info?`: `Record`\<`string`, `unknown`\>; \}\>

Defined in: [core/src/schemas.ts:5](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/schemas.ts#L5)
