[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / IgnitionEnv

# Class: IgnitionEnv

Defined in: [core/src/ignition-env.ts:5](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L5)

## Constructors

### Constructor

> **new IgnitionEnv**(`env`): `IgnitionEnv`

Defined in: [core/src/ignition-env.ts:27](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L27)

#### Parameters

##### env

[`TrainingEnv`](../interfaces/TrainingEnv.md)

#### Returns

`IgnitionEnv`

## Properties

### lastError

> **lastError**: `Error` \| `null` = `null`

Defined in: [core/src/ignition-env.ts:14](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L14)

Most recent automatic-loop failure; cleared when a new loop starts.

***

### stepCount

> **stepCount**: `number` = `0`

Defined in: [core/src/ignition-env.ts:15](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L15)

***

### stepIntervalMs

> **stepIntervalMs**: `number` = `50`

Defined in: [core/src/ignition-env.ts:18](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L18)

Milliseconds between steps. Lower = faster training. Default 50ms (20 steps/sec).

***

### stepsPerTick

> **stepsPerTick**: `number` = `1`

Defined in: [core/src/ignition-env.ts:21](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L21)

Number of steps to run per tick. >1 = batch multiple steps before yielding to the event loop.

***

### factories

> `protected` **factories**: `Record`\<`string`, [`AgentFactory`](../type-aliases/AgentFactory.md)\> = `{}`

Defined in: [core/src/ignition-env.ts:23](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L23)

***

### algorithmDefaults

> `protected` **algorithmDefaults**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\> = `{}`

Defined in: [core/src/ignition-env.ts:24](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L24)

## Accessors

### agent

#### Get Signature

> **get** **agent**(): [`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

Defined in: [core/src/ignition-env.ts:33](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L33)

##### Returns

[`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

#### Set Signature

> **set** **agent**(`value`): `void`

Defined in: [core/src/ignition-env.ts:37](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L37)

##### Parameters

###### value

[`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

##### Returns

`void`

## Methods

### train()

> **train**(`algorithm?`, `overrides?`): `void`

Defined in: [core/src/ignition-env.ts:41](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L41)

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

Defined in: [core/src/ignition-env.ts:73](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L73)

#### Returns

`Promise`\<[`StepResult`](../interfaces/StepResult.md)\>

***

### inferStep()

> **inferStep**(): `Promise`\<[`StepResult`](../interfaces/StepResult.md)\>

Defined in: [core/src/ignition-env.ts:77](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L77)

#### Returns

`Promise`\<[`StepResult`](../interfaces/StepResult.md)\>

***

### infer()

> **infer**(): `void`

Defined in: [core/src/ignition-env.ts:111](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L111)

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: [core/src/ignition-env.ts:116](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L116)

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [core/src/ignition-env.ts:147](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L147)

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [core/src/ignition-env.ts:154](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L154)

#### Returns

`void`

***

### setSpeed()

> **setSpeed**(`multiplier`): `void`

Defined in: [core/src/ignition-env.ts:164](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L164)

Set training speed. Multiplier: 1x = normal (50ms, 1 step/tick), 10x = fast, 50x = turbo.

#### Parameters

##### multiplier

`number`

#### Returns

`void`

***

### save()

> **save**(`modelId`, `metadata?`): `Promise`\<`string` \| `void`\>

Defined in: [core/src/ignition-env.ts:184](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L184)

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

Defined in: [core/src/ignition-env.ts:201](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/core/src/ignition-env.ts#L201)

Load a previously saved agent model + training state.
Requires the agent to implement `load()`.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>
