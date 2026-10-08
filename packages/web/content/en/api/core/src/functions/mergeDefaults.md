[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / mergeDefaults

# Function: mergeDefaults()

> **mergeDefaults**(`defaults`, `overrides`): `Record`\<`string`, `unknown`\>

Defined in: [core/src/defaults.ts:5](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/defaults.ts#L5)

Shallow-merge algorithm defaults with user overrides.
Overrides take precedence. Arrays are replaced, not deep-merged.

## Parameters

### defaults

`Record`\<`string`, `unknown`\>

### overrides

`Record`\<`string`, `unknown`\> \| `undefined`

## Returns

`Record`\<`string`, `unknown`\>
