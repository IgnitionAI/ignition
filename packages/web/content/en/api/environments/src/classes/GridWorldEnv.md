[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [environments/src](../README.md) / GridWorldEnv

# Class: GridWorldEnv

Defined in: [environments/src/gridworld.ts:3](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L3)

## Implements

- `TrainingEnv`

## Constructors

### Constructor

> **new GridWorldEnv**(`gridSize?`): `GridWorldEnv`

Defined in: [environments/src/gridworld.ts:15](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L15)

#### Parameters

##### gridSize?

`number` = `7`

#### Returns

`GridWorldEnv`

## Properties

### actions

> **actions**: `string`[]

Defined in: [environments/src/gridworld.ts:4](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L4)

Available actions: named list or count

#### Implementation of

`TrainingEnv.actions`

***

### agentRow

> **agentRow**: `number` = `0`

Defined in: [environments/src/gridworld.ts:5](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L5)

***

### agentCol

> **agentCol**: `number` = `0`

Defined in: [environments/src/gridworld.ts:6](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L6)

***

### targetRow

> `readonly` **targetRow**: `number`

Defined in: [environments/src/gridworld.ts:7](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L7)

***

### targetCol

> `readonly` **targetCol**: `number`

Defined in: [environments/src/gridworld.ts:8](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L8)

***

### gridSize

> `readonly` **gridSize**: `number`

Defined in: [environments/src/gridworld.ts:9](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L9)

***

### stepCount

> **stepCount**: `number` = `0`

Defined in: [environments/src/gridworld.ts:10](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L10)

***

### trail

> **trail**: \[`number`, `number`\][] = `[]`

Defined in: [environments/src/gridworld.ts:11](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L11)

## Methods

### observe()

> **observe**(): `number`[]

Defined in: [environments/src/gridworld.ts:21](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L21)

Return the current observation as a number array

#### Returns

`number`[]

#### Implementation of

`TrainingEnv.observe`

***

### step()

> **step**(`action`): `void`

Defined in: [environments/src/gridworld.ts:31](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L31)

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

Defined in: [environments/src/gridworld.ts:43](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L43)

Return the reward for the current state

#### Returns

`number`

#### Implementation of

`TrainingEnv.reward`

***

### done()

> **done**(): `boolean`

Defined in: [environments/src/gridworld.ts:48](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L48)

Return true if the episode is over

#### Returns

`boolean`

#### Implementation of

`TrainingEnv.done`

***

### reset()

> **reset**(): `void`

Defined in: [environments/src/gridworld.ts:53](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/environments/src/gridworld.ts#L53)

Reset the environment for a new episode

#### Returns

`void`

#### Implementation of

`TrainingEnv.reset`
