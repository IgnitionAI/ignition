[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / AgentInterface

# Interface: AgentInterface

Defined in: [core/src/types.ts:53](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L53)

## Extended by

- [`CheckpointableAgent`](CheckpointableAgent.md)

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

***

### remember()

> **remember**(`experience`): `void`

Defined in: [core/src/types.ts:55](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L55)

#### Parameters

##### experience

[`Experience`](Experience.md)

#### Returns

`void`

***

### train()

> **train**(): `Promise`\<`void`\>

Defined in: [core/src/types.ts:56](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L56)

#### Returns

`Promise`\<`void`\>

***

### dispose()?

> `optional` **dispose**(): `void`

Defined in: [core/src/types.ts:58](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L58)

Release TF/GPU/WASM resources held by the agent

#### Returns

`void`

***

### reset()?

> `optional` **reset**(): `void`

Defined in: [core/src/types.ts:60](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L60)

Reset agent internal state (epsilon, memory, counters…)

#### Returns

`void`

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

***

### getState()?

> `optional` **getState**(): `Record`\<`string`, `unknown`\>

Defined in: [core/src/types.ts:71](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L71)

Serialize internal state (epsilon, stepCount, etc.) for checkpointing.

#### Returns

`Record`\<`string`, `unknown`\>

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
