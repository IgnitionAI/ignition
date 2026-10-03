[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / DQNAgent

# Class: DQNAgent

Defined in: [backend-tfjs/src/agents/dqn.ts:12](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L12)

## Implements

- [`AgentInterface`](../interfaces/AgentInterface.md)

## Constructors

### Constructor

> **new DQNAgent**(`config`): `DQNAgent`

Defined in: [backend-tfjs/src/agents/dqn.ts:27](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L27)

#### Parameters

##### config

[`DQNConfig`](../interfaces/DQNConfig.md)

#### Returns

`DQNAgent`

## Methods

### getAction()

> **getAction**(`state`, `greedy?`): `Promise`\<`number`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:74](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L74)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:89](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L89)

#### Parameters

##### exp

[`Experience`](../interfaces/Experience.md)

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`remember`](../interfaces/AgentInterface.md#remember)

***

### getModel()

> **getModel**(): `LayersModel`

Defined in: [backend-tfjs/src/agents/dqn.ts:94](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L94)

The current Q-network for prediction or export. Do not dispose it while the agent is in use.

#### Returns

`LayersModel`

***

### updateTargetModel()

> **updateTargetModel**(): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:98](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L98)

#### Returns

`Promise`\<`void`\>

***

### train()

> **train**(): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:102](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L102)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`train`](../interfaces/AgentInterface.md#train)

***

### reset()

> **reset**(): `void`

Defined in: [backend-tfjs/src/agents/dqn.ts:145](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L145)

Reset agent internal state (epsilon, memory, counters…)

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`reset`](../interfaces/AgentInterface.md#reset)

***

### saveToHub()

> **saveToHub**(`repoId`, `token`, `modelName?`, `checkpointName?`): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/dqn.ts:151](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L151)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:156](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L156)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:162](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L162)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:169](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L169)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:179](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L179)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:195](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L195)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:210](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L210)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:228](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L228)

Serialize internal state (epsilon, stepCount, etc.) for checkpointing.

#### Returns

`Record`\<`string`, `unknown`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`getState`](../interfaces/AgentInterface.md#getstate)

***

### setState()

> **setState**(`state`): `void`

Defined in: [backend-tfjs/src/agents/dqn.ts:236](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L236)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:243](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L243)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:247](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L247)

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

Defined in: [backend-tfjs/src/agents/dqn.ts:251](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/dqn.ts#L251)

Release TF/GPU/WASM resources held by the agent

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`dispose`](../interfaces/AgentInterface.md#dispose)
