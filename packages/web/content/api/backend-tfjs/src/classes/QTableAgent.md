[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / QTableAgent

# Class: QTableAgent

Defined in: [backend-tfjs/src/agents/qtable.ts:16](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L16)

## Implements

- [`AgentInterface`](../interfaces/AgentInterface.md)

## Constructors

### Constructor

> **new QTableAgent**(`config`): `QTableAgent`

Defined in: [backend-tfjs/src/agents/qtable.ts:35](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L35)

#### Parameters

##### config

[`QTableConfig`](../interfaces/QTableConfig.md)

#### Returns

`QTableAgent`

## Accessors

### tableSize

#### Get Signature

> **get** **tableSize**(): `number`

Defined in: [backend-tfjs/src/agents/qtable.ts:173](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L173)

Nombre d'états visités.

##### Returns

`number`

***

### currentEpsilon

#### Get Signature

> **get** **currentEpsilon**(): `number`

Defined in: [backend-tfjs/src/agents/qtable.ts:178](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L178)

Taux d'exploration courant.

##### Returns

`number`

## Methods

### getAction()

> **getAction**(`state`, `greedy?`): `Promise`\<`number`\>

Defined in: [backend-tfjs/src/agents/qtable.ts:116](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L116)

Sélectionner une action par politique epsilon-greedy.
Exploration : action aléatoire (prob. ε)
Exploitation : argmax Q(s, ·)

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

> **remember**(`experience`): `void`

Defined in: [backend-tfjs/src/agents/qtable.ts:129](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L129)

Stocker l'expérience pour le prochain appel à train().

#### Parameters

##### experience

[`Experience`](../interfaces/Experience.md)

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`remember`](../interfaces/AgentInterface.md#remember)

***

### train()

> **train**(): `Promise`\<`void`\>

Defined in: [backend-tfjs/src/agents/qtable.ts:140](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L140)

Effectuer une mise à jour Q-Learning sur la dernière expérience.

Q(s,a) ← Q(s,a) + α·[r + γ·max_{a'} Q(s',a')·(1−done) − Q(s,a)]

Décroît epsilon après chaque update.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`train`](../interfaces/AgentInterface.md#train)

***

### getState()

> **getState**(): `Record`\<`string`, `unknown`\>

Defined in: [backend-tfjs/src/agents/qtable.ts:184](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L184)

Serialize internal state (epsilon, stepCount, etc.) for checkpointing.

#### Returns

`Record`\<`string`, `unknown`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`getState`](../interfaces/AgentInterface.md#getstate)

***

### setState()

> **setState**(`state`): `void`

Defined in: [backend-tfjs/src/agents/qtable.ts:190](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L190)

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

Defined in: [backend-tfjs/src/agents/qtable.ts:198](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L198)

Serialize the Q-table to a JSON-compatible object.
Stores in localStorage under the given modelId.

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

Defined in: [backend-tfjs/src/agents/qtable.ts:222](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/qtable.ts#L222)

Load a previously saved model and state.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`load`](../interfaces/AgentInterface.md#load)
