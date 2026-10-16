[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / CheckpointableAgent

# Interface: CheckpointableAgent

Defined in: [core/src/types.ts:81](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L81)

Extends AgentInterface with checkpoint persistence.
Implement this on agents that support saving to external storage (e.g. HF Hub).

## Extends

- [`AgentInterface`](AgentInterface.md)

## Methods

### getAction()

> **getAction**(`observation`, `greedy?`): `Promise`\<`number` \| `number`[]\>

Defined in: [core/src/types.ts:54](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L54)

#### Parameters

##### observation

`number`[]

##### greedy?

`boolean`

#### Returns

`Promise`\<`number` \| `number`[]\>

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`getAction`](AgentInterface.md#getaction)

***

### remember()

> **remember**(`experience`): `void`

Defined in: [core/src/types.ts:55](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L55)

#### Parameters

##### experience

[`Experience`](Experience.md)

#### Returns

`void`

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`remember`](AgentInterface.md#remember)

***

### train()

> **train**(): `Promise`\<`void`\>

Defined in: [core/src/types.ts:56](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L56)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`train`](AgentInterface.md#train)

***

### dispose()?

> `optional` **dispose**(): `void`

Defined in: [core/src/types.ts:58](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L58)

Release TF/GPU/WASM resources held by the agent

#### Returns

`void`

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`dispose`](AgentInterface.md#dispose)

***

### reset()?

> `optional` **reset**(): `void`

Defined in: [core/src/types.ts:60](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L60)

Reset agent internal state (epsilon, memory, counters…)

#### Returns

`void`

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`reset`](AgentInterface.md#reset)

***

### save()?

> `optional` **save**(`modelId`, `metadata?`): `Promise`\<`string` \| `void`\>

Defined in: [core/src/types.ts:65](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L65)

Save the agent's model and state. Returns URI or void.

#### Parameters

##### modelId

`string`

##### metadata?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`string` \| `void`\>

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`save`](AgentInterface.md#save)

***

### load()?

> `optional` **load**(`modelId`): `Promise`\<`void`\>

Defined in: [core/src/types.ts:68](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L68)

Load a previously saved model and state.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`load`](AgentInterface.md#load)

***

### getState()?

> `optional` **getState**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/types.ts:71](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L71)

Serialize internal state (epsilon, stepCount, etc.) for checkpointing.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`getState`](AgentInterface.md#getstate)

***

### setState()?

> `optional` **setState**(`state`): `void`

Defined in: [core/src/types.ts:74](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L74)

Restore internal state from a serialized object.

#### Parameters

##### state

`Record`\<`string`, `unknown`\>

#### Returns

`void`

#### Inherited from

[`AgentInterface`](AgentInterface.md).[`setState`](AgentInterface.md#setstate)

***

### saveCheckpoint()

> **saveCheckpoint**(`repoId`, `token`, `checkpointName`): `Promise`\<`void`\>

Defined in: [core/src/types.ts:82](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L82)

#### Parameters

##### repoId

`string`

##### token

`string`

##### checkpointName

`string`

#### Returns

`Promise`\<`void`\>
