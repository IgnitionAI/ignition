[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / AgentInterface

# Interface: AgentInterface

Defined in: core/dist/types.d.ts:38

## Methods

### getAction()

> **getAction**(`observation`, `greedy?`): `Promise`\<`number` \| `number`[]\>

Defined in: core/dist/types.d.ts:39

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

Defined in: core/dist/types.d.ts:40

#### Parameters

##### experience

[`Experience`](Experience.md)

#### Returns

`void`

***

### train()

> **train**(): `Promise`\<`void`\>

Defined in: core/dist/types.d.ts:41

#### Returns

`Promise`\<`void`\>

***

### dispose()?

> `optional` **dispose**(): `void`

Defined in: core/dist/types.d.ts:43

Release TF/GPU/WASM resources held by the agent

#### Returns

`void`

***

### reset()?

> `optional` **reset**(): `void`

Defined in: core/dist/types.d.ts:45

Reset agent internal state (epsilon, memory, counters…)

#### Returns

`void`

***

### save()?

> `optional` **save**(`modelId`, `metadata?`): `Promise`\<`string` \| `void`\>

Defined in: core/dist/types.d.ts:47

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

Defined in: core/dist/types.d.ts:49

Load a previously saved model and state.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

***

### getState()?

> `optional` **getState**(): `Record`\<`string`, `unknown`\>

Defined in: core/dist/types.d.ts:51

Serialize internal state (epsilon, stepCount, etc.) for checkpointing.

#### Returns

`Record`\<`string`, `unknown`\>

***

### setState()?

> `optional` **setState**(`state`): `void`

Defined in: core/dist/types.d.ts:53

Restore internal state from a serialized object.

#### Parameters

##### state

`Record`\<`string`, `unknown`\>

#### Returns

`void`
