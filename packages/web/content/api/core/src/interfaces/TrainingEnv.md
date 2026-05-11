[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / TrainingEnv

# Interface: TrainingEnv

Defined in: [core/src/types.ts:91](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L91)

Contract for a training environment. The developer implements this
to describe their game/simulation for RL training.

## Properties

### actions

> **actions**: `number` \| `string`[]

Defined in: [core/src/types.ts:93](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L93)

Available actions: named list or count

## Methods

### observe()

> **observe**(): `number`[]

Defined in: [core/src/types.ts:95](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L95)

Return the current observation as a number array

#### Returns

`number`[]

***

### step()

> **step**(`action`): `void`

Defined in: [core/src/types.ts:97](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L97)

Apply an action to the environment

#### Parameters

##### action

`number` \| `number`[]

#### Returns

`void`

***

### reward()

> **reward**(): `number`

Defined in: [core/src/types.ts:99](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L99)

Return the reward for the current state

#### Returns

`number`

***

### done()

> **done**(): `boolean`

Defined in: [core/src/types.ts:101](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L101)

Return true if the episode is over

#### Returns

`boolean`

***

### reset()

> **reset**(): `void`

Defined in: [core/src/types.ts:103](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L103)

Reset the environment for a new episode

#### Returns

`void`
