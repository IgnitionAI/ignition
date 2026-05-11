[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / DQNAgent

# Class: DQNAgent

Defined in: [backend-tfjs/src/agents/dqn.ts:12](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L12)

## Implements

- [`AgentInterface`](../interfaces/AgentInterface.md)

## Constructors

### Constructor

> **new DQNAgent**(`config`): `DQNAgent`

Defined in: [backend-tfjs/src/agents/dqn.ts:26](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L26)

#### Parameters

##### config

[`DQNConfig`](../interfaces/DQNConfig.md)

#### Returns

`DQNAgent`

## Methods

### getAction()

> **getAction**(`state`, `greedy?`): `Promise`\<`number`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:66](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L66)

#### Parameters

##### state

`number`[]

##### greedy?

`boolean`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`getAction`](../interfaces/AgentInterface.md#getaction)

***

### remember()

> **remember**(`exp`): `void`

Defined in: [backend-tfjs/src/agents/dqn.ts:81](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L81)

#### Parameters

##### exp

[`Experience`](../interfaces/Experience.md)

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`remember`](../interfaces/AgentInterface.md#remember)

***

### updateTargetModel()

> **updateTargetModel**(): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:85](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L85)

#### Returns

`Promise`\<`void`\>

***

### train()

> **train**(): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:89](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L89)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`train`](../interfaces/AgentInterface.md#train)

***

### reset()

> **reset**(): `void`

Defined in: [backend-tfjs/src/agents/dqn.ts:128](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L128)

Reset agent internal state (epsilon, memory, counters…)

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`reset`](../interfaces/AgentInterface.md#reset)

***

### saveToHub()

> **saveToHub**(`repoId`, `token`, `modelName?`, `checkpointName?`): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:134](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L134)

#### Parameters

##### repoId

`string`

##### token

`string`

##### modelName?

`string` = `'model'`

##### checkpointName?

`string` = `'last'`

#### Returns

`Promise`\<`void`\>

***

### loadFromHub()

> **loadFromHub**(`repoId`, `modelPath?`): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:139](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L139)

#### Parameters

##### repoId

`string`

##### modelPath?

`string` = `'model.json'`

#### Returns

`Promise`\<`void`\>

***

### saveCheckpoint()

> **saveCheckpoint**(`repoId`, `token`, `checkpointName`): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:146](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L146)

#### Parameters

##### repoId

`string`

##### token

`string`

##### checkpointName

`string`

#### Returns

`Promise`\<`void`\>

***

### maybeSaveBestCheckpoint()

> **maybeSaveBestCheckpoint**(`repoId`, `token`, `reward`, `step?`): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:153](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L153)

#### Parameters

##### repoId

`string`

##### token

`string`

##### reward

`number`

##### step?

`number`

#### Returns

`Promise`\<`void`\>

***

### loadCheckpoint()

> **loadCheckpoint**(`repoId`, `checkpointName`): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:163](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L163)

#### Parameters

##### repoId

`string`

##### checkpointName

`string`

#### Returns

`Promise`\<`void`\>

***

### saveModel()

> **saveModel**(`modelId`, `metadata?`): `Promise`\<`string`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:180](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L180)

Save the model via the configured storageProvider.
Throws if no storageProvider was supplied in DQNConfig.

#### Parameters

##### modelId

`string`

##### metadata?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`string`\>

the URI returned by the provider (e.g. "hf://user/repo/modelId")

***

### loadModel()

> **loadModel**(`modelId`): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:195](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L195)

Load a model via the configured storageProvider and replace the current model.
Throws if no storageProvider was supplied in DQNConfig.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

***

### getState()

> **getState**(): `Record`\<`string`, `unknown`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:205](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L205)

Serialize internal state (epsilon, stepCount, etc.) for checkpointing.

#### Returns

`Record`\<`string`, `unknown`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`getState`](../interfaces/AgentInterface.md#getstate)

***

### setState()

> **setState**(`state`): `void`

Defined in: [backend-tfjs/src/agents/dqn.ts:213](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L213)

Restore internal state from a serialized object.

#### Parameters

##### state

`Record`\<`string`, `unknown`\>

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`setState`](../interfaces/AgentInterface.md#setstate)

***

### save()

> **save**(`modelId`, `metadata?`): `Promise`\<`string`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:220](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L220)

Save the agent's model and state. Returns URI or void.

#### Parameters

##### modelId

`string`

##### metadata?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`save`](../interfaces/AgentInterface.md#save)

***

### load()

> **load**(`modelId`): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:224](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L224)

Load a previously saved model and state.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`load`](../interfaces/AgentInterface.md#load)

***

### dispose()

> **dispose**(): `void`

Defined in: [backend-tfjs/src/agents/dqn.ts:228](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/dqn.ts#L228)

Release TF/GPU/WASM resources held by the agent

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`dispose`](../interfaces/AgentInterface.md#dispose)
