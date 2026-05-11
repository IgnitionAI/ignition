[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / IgnitionEnv

# Class: IgnitionEnv

Defined in: [core/src/ignition-env.ts:5](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L5)

## Constructors

### Constructor

> **new IgnitionEnv**(`env`): `IgnitionEnv`

Defined in: [core/src/ignition-env.ts:22](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L22)

#### Parameters

##### env

[`TrainingEnv`](../interfaces/TrainingEnv.md)

#### Returns

`IgnitionEnv`

## Properties

### stepCount

> **stepCount**: `number` = `0`

Defined in: [core/src/ignition-env.ts:10](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L10)

***

### stepIntervalMs

> **stepIntervalMs**: `number` = `50`

Defined in: [core/src/ignition-env.ts:13](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L13)

Milliseconds between steps. Lower = faster training. Default 50ms (20 steps/sec).

***

### stepsPerTick

> **stepsPerTick**: `number` = `1`

Defined in: [core/src/ignition-env.ts:16](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L16)

Number of steps to run per tick. >1 = batch multiple steps before yielding to the event loop.

***

### factories

> `protected` **factories**: `Record`\<`string`, [`AgentFactory`](../type-aliases/AgentFactory.md)\> = `{}`

Defined in: [core/src/ignition-env.ts:18](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L18)

***

### algorithmDefaults

> `protected` **algorithmDefaults**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\> = `{}`

Defined in: [core/src/ignition-env.ts:19](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L19)

## Accessors

### agent

#### Get Signature

> **get** **agent**(): [`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

Defined in: [core/src/ignition-env.ts:28](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L28)

##### Returns

[`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

#### Set Signature

> **set** **agent**(`value`): `void`

Defined in: [core/src/ignition-env.ts:32](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L32)

##### Parameters

###### value

[`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

##### Returns

`void`

## Methods

### train()

> **train**(`algorithm?`, `overrides?`): `void`

Defined in: [core/src/ignition-env.ts:36](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L36)

#### Parameters

##### algorithm?

[`AlgorithmType`](../type-aliases/AlgorithmType.md)

##### overrides?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### step()

> **step**(): `Promise`\<[`StepResult`](../interfaces/StepResult.md)\>

Defined in: [core/src/ignition-env.ts:71](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L71)

#### Returns

`Promise`\<[`StepResult`](../interfaces/StepResult.md)\>

***

### inferStep()

> **inferStep**(): `Promise`\<[`StepResult`](../interfaces/StepResult.md)\>

Defined in: [core/src/ignition-env.ts:109](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L109)

#### Returns

`Promise`\<[`StepResult`](../interfaces/StepResult.md)\>

***

### infer()

> **infer**(): `void`

Defined in: [core/src/ignition-env.ts:135](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L135)

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: [core/src/ignition-env.ts:155](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L155)

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [core/src/ignition-env.ts:171](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L171)

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [core/src/ignition-env.ts:175](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L175)

#### Returns

`void`

***

### setSpeed()

> **setSpeed**(`multiplier`): `void`

Defined in: [core/src/ignition-env.ts:184](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L184)

Set training speed. Multiplier: 1x = normal (50ms, 1 step/tick), 10x = fast, 50x = turbo.

#### Parameters

##### multiplier

`number`

#### Returns

`void`

***

### save()

> **save**(`modelId`, `metadata?`): `Promise`\<`string` \| `void`\>

Defined in: [core/src/ignition-env.ts:204](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L204)

Save the current agent model + training state.
Requires the agent to implement `save()`.

#### Parameters

##### modelId

`string`

##### metadata?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`string` \| `void`\>

***

### load()

> **load**(`modelId`): `Promise`\<`void`\>

Defined in: [core/src/ignition-env.ts:221](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/ignition-env.ts#L221)

Load a previously saved agent model + training state.
Requires the agent to implement `load()`.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>
