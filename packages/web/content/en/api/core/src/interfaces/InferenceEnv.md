[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / InferenceEnv

# Interface: InferenceEnv

Defined in: [core/src/types.ts:109](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L109)

Minimal contract for inference (production). No training, no rewards.

## Methods

### observe()

> **observe**(): `number`[]

Defined in: [core/src/types.ts:111](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L111)

Return the current observation

#### Returns

`number`[]

***

### step()

> **step**(`action`): `void`

Defined in: [core/src/types.ts:113](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L113)

Apply an action

#### Parameters

##### action

`number` \| `number`[]

#### Returns

`void`
