[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [environments/src](../README.md) / MountainCarEnv

# Class: MountainCarEnv

Defined in: [environments/src/mountaincar.ts:12](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L12)

## Implements

- `TrainingEnv`

## Constructors

### Constructor

> **new MountainCarEnv**(): `MountainCarEnv`

Defined in: [environments/src/mountaincar.ts:18](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L18)

#### Returns

`MountainCarEnv`

## Properties

### actions

> **actions**: `string`[]

Defined in: [environments/src/mountaincar.ts:13](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L13)

Available actions: named list or count

#### Implementation of

`TrainingEnv.actions`

***

### position

> **position**: `number`

Defined in: [environments/src/mountaincar.ts:14](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L14)

***

### velocity

> **velocity**: `number`

Defined in: [environments/src/mountaincar.ts:15](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L15)

***

### stepCount

> **stepCount**: `number` = `0`

Defined in: [environments/src/mountaincar.ts:16](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L16)

## Methods

### observe()

> **observe**(): `number`[]

Defined in: [environments/src/mountaincar.ts:23](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L23)

Return the current observation as a number array

#### Returns

`number`[]

#### Implementation of

`TrainingEnv.observe`

***

### step()

> **step**(`action`): `void`

Defined in: [environments/src/mountaincar.ts:27](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L27)

Apply an action to the environment

#### Parameters

##### action

`number` \| `number`[]

#### Returns

`void`

#### Implementation of

`TrainingEnv.step`

***

### reward()

> **reward**(): `number`

Defined in: [environments/src/mountaincar.ts:43](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L43)

Return the reward for the current state

#### Returns

`number`

#### Implementation of

`TrainingEnv.reward`

***

### done()

> **done**(): `boolean`

Defined in: [environments/src/mountaincar.ts:47](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L47)

Return true if the episode is over

#### Returns

`boolean`

#### Implementation of

`TrainingEnv.done`

***

### reset()

> **reset**(): `void`

Defined in: [environments/src/mountaincar.ts:51](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L51)

Reset the environment for a new episode

#### Returns

`void`

#### Implementation of

`TrainingEnv.reset`

***

### height()

> **height**(`x`): `number`

Defined in: [environments/src/mountaincar.ts:58](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/mountaincar.ts#L58)

Valley height at a given position: sin(3x)

#### Parameters

##### x

`number`

#### Returns

`number`
