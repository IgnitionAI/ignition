[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / ReplayBuffer

# Class: ReplayBuffer

Defined in: [backend-tfjs/src/memory/ReplayBuffer.ts:5](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/memory/ReplayBuffer.ts#L5)

## Constructors

### Constructor

> **new ReplayBuffer**(`capacity?`): `ReplayBuffer`

Defined in: [backend-tfjs/src/memory/ReplayBuffer.ts:11](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/memory/ReplayBuffer.ts#L11)

#### Parameters

##### capacity?

`number` = `10000`

#### Returns

`ReplayBuffer`

## Methods

### add()

> **add**(`exp`): `void`

Defined in: [backend-tfjs/src/memory/ReplayBuffer.ts:17](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/memory/ReplayBuffer.ts#L17)

O(1) circular-buffer insert

#### Parameters

##### exp

[`Experience`](../interfaces/Experience.md)

#### Returns

`void`

***

### sample()

> **sample**(`batchSize`): [`Experience`](../interfaces/Experience.md)[]

Defined in: [backend-tfjs/src/memory/ReplayBuffer.ts:23](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/memory/ReplayBuffer.ts#L23)

#### Parameters

##### batchSize

`number`

#### Returns

[`Experience`](../interfaces/Experience.md)[]

***

### size()

> **size**(): `number`

Defined in: [backend-tfjs/src/memory/ReplayBuffer.ts:32](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/memory/ReplayBuffer.ts#L32)

#### Returns

`number`
