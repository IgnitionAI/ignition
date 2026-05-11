[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [storage/src](../README.md) / parseHFConfig

# Function: parseHFConfig()

> **parseHFConfig**(`env?`): `object`

Defined in: [storage/src/config.ts:20](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/config.ts#L20)

Read HF_TOKEN and HF_REPO_ID from environment variables and validate them.
Throws a descriptive ZodError if either is missing or malformed.

## Parameters

### env?

`Record`\<`string`, `string` \| `undefined`\> = `process.env`

## Returns

`object`

### token

> **token**: `string`

### repoId

> **repoId**: `string`
