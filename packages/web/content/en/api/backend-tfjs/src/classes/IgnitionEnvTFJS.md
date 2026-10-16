[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / IgnitionEnvTFJS

# Class: IgnitionEnvTFJS

Defined in: [backend-tfjs/src/ignition-env-tfjs.ts:25](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/ignition-env-tfjs.ts#L25)

IgnitionEnv with TF.js agent factories baked in.

```ts
import { IgnitionEnv } from '@ignitionai/backend-tfjs';

const env = new IgnitionEnv(new MyGameEnv());
env.train();           // DQN with auto-defaults
env.train('ppo');      // switch to PPO
```

## Extends

- `IgnitionEnv`

## Constructors

### Constructor

> **new IgnitionEnvTFJS**(`env`): `IgnitionEnvTFJS`

Defined in: [backend-tfjs/src/ignition-env-tfjs.ts:26](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/ignition-env-tfjs.ts#L26)

#### Parameters

##### env

`TrainingEnv`

#### Returns

`IgnitionEnvTFJS`

#### Overrides

`IgnitionEnv.constructor`

## Properties

### stepCount

> **stepCount**: `number`

Defined in: core/dist/ignition-env.d.ts:7

#### Inherited from

`IgnitionEnv.stepCount`

***

### stepIntervalMs

> **stepIntervalMs**: `number`

Defined in: core/dist/ignition-env.d.ts:9

Milliseconds between steps. Lower = faster training. Default 50ms (20 steps/sec).

#### Inherited from

`IgnitionEnv.stepIntervalMs`

***

### stepsPerTick

> **stepsPerTick**: `number`

Defined in: core/dist/ignition-env.d.ts:11

Number of steps to run per tick. >1 = batch multiple steps before yielding to the event loop.

#### Inherited from

`IgnitionEnv.stepsPerTick`

***

### factories

> `protected` **factories**: `Record`\<`string`, `AgentFactory`\>

Defined in: core/dist/ignition-env.d.ts:12

#### Inherited from

`IgnitionEnv.factories`

***

### algorithmDefaults

> `protected` **algorithmDefaults**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: core/dist/ignition-env.d.ts:13

#### Inherited from

`IgnitionEnv.algorithmDefaults`

## Accessors

### agent

#### Get Signature

> **get** **agent**(): [`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

Defined in: core/dist/ignition-env.d.ts:16

##### Returns

[`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

#### Set Signature

> **set** **agent**(`value`): `void`

Defined in: core/dist/ignition-env.d.ts:17

##### Parameters

###### value

[`AgentInterface`](../interfaces/AgentInterface.md) \| `null`

##### Returns

`void`

#### Inherited from

`IgnitionEnv.agent`

## Methods

### train()

> **train**(`algorithm?`, `overrides?`): `void`

Defined in: core/dist/ignition-env.d.ts:18

#### Parameters

##### algorithm?

`AlgorithmType`

##### overrides?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

#### Inherited from

`IgnitionEnv.train`

***

### step()

> **step**(): `Promise`\<`StepResult`\>

Defined in: core/dist/ignition-env.d.ts:19

#### Returns

`Promise`\<`StepResult`\>

#### Inherited from

`IgnitionEnv.step`

***

### inferStep()

> **inferStep**(): `Promise`\<`StepResult`\>

Defined in: core/dist/ignition-env.d.ts:20

#### Returns

`Promise`\<`StepResult`\>

#### Inherited from

`IgnitionEnv.inferStep`

***

### infer()

> **infer**(): `void`

Defined in: core/dist/ignition-env.d.ts:21

#### Returns

`void`

#### Inherited from

`IgnitionEnv.infer`

***

### start()

> **start**(): `void`

Defined in: core/dist/ignition-env.d.ts:22

#### Returns

`void`

#### Inherited from

`IgnitionEnv.start`

***

### stop()

> **stop**(): `void`

Defined in: core/dist/ignition-env.d.ts:23

#### Returns

`void`

#### Inherited from

`IgnitionEnv.stop`

***

### reset()

> **reset**(): `void`

Defined in: core/dist/ignition-env.d.ts:24

#### Returns

`void`

#### Inherited from

`IgnitionEnv.reset`

***

### setSpeed()

> **setSpeed**(`multiplier`): `void`

Defined in: core/dist/ignition-env.d.ts:28

Set training speed. Multiplier: 1x = normal (50ms, 1 step/tick), 10x = fast, 50x = turbo.

#### Parameters

##### multiplier

`number`

#### Returns

`void`

#### Inherited from

`IgnitionEnv.setSpeed`

***

### save()

> **save**(`modelId`, `metadata?`): `Promise`\<`string` \| `void`\>

Defined in: core/dist/ignition-env.d.ts:33

Save the current agent model + training state.
Requires the agent to implement `save()`.

#### Parameters

##### modelId

`string`

##### metadata?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`string` \| `void`\>

#### Inherited from

`IgnitionEnv.save`

***

### load()

> **load**(`modelId`): `Promise`\<`void`\>

Defined in: core/dist/ignition-env.d.ts:38

Load a previously saved agent model + training state.
Requires the agent to implement `load()`.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`IgnitionEnv.load`
