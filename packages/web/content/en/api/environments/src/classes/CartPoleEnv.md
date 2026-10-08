[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [environments/src](../README.md) / CartPoleEnv

# Class: CartPoleEnv

Defined in: [environments/src/cartpole.ts:23](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L23)

## Implements

- `TrainingEnv`

## Constructors

### Constructor

> **new CartPoleEnv**(): `CartPoleEnv`

Defined in: [environments/src/cartpole.ts:27](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L27)

#### Returns

`CartPoleEnv`

## Properties

### actions

> **actions**: `string`[]

Defined in: [environments/src/cartpole.ts:24](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L24)

Available actions: named list or count

#### Implementation of

`TrainingEnv.actions`

***

### state

> **state**: [`CartPoleState`](../interfaces/CartPoleState.md)

Defined in: [environments/src/cartpole.ts:25](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L25)

## Methods

### observe()

> **observe**(): `number`[]

Defined in: [environments/src/cartpole.ts:41](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L41)

Return the current observation as a number array

#### Returns

`number`[]

#### Implementation of

`TrainingEnv.observe`

***

### step()

> **step**(`action`): `void`

Defined in: [environments/src/cartpole.ts:45](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L45)

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

Defined in: [environments/src/cartpole.ts:67](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L67)

Return the reward for the current state

#### Returns

`number`

#### Implementation of

`TrainingEnv.reward`

***

### done()

> **done**(): `boolean`

Defined in: [environments/src/cartpole.ts:71](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L71)

Return true if the episode is over

#### Returns

`boolean`

#### Implementation of

`TrainingEnv.done`

***

### reset()

> **reset**(): `void`

Defined in: [environments/src/cartpole.ts:79](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/cartpole.ts#L79)

Reset the environment for a new episode

#### Returns

`void`

#### Implementation of

`TrainingEnv.reset`
