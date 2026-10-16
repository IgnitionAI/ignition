[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / QTableAgent

# Class: QTableAgent

Defined in: [backend-tfjs/src/agents/qtable.ts:23](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L23)

## Implements

- [`AgentInterface`](../interfaces/AgentInterface.md)

## Constructors

### Constructor

> **new QTableAgent**(`config`): `QTableAgent`

Defined in: [backend-tfjs/src/agents/qtable.ts:42](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L42)

#### Parameters

##### config

[`QTableConfig`](../interfaces/QTableConfig.md)

#### Returns

`QTableAgent`

## Accessors

### tableSize

#### Get Signature

> **get** **tableSize**(): `number`

Defined in: [backend-tfjs/src/agents/qtable.ts:180](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L180)

Nombre d'états visités.

##### Returns

`number`

***

### currentEpsilon

#### Get Signature

> **get** **currentEpsilon**(): `number`

Defined in: [backend-tfjs/src/agents/qtable.ts:185](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L185)

Taux d'exploration courant.

##### Returns

`number`

## Methods

### getAction()

> **getAction**(`state`, `greedy?`): `Promise`\<`number`\>

Defined in: [backend-tfjs/src/agents/qtable.ts:123](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L123)

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

Defined in: [backend-tfjs/src/agents/qtable.ts:136](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L136)

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

Defined in: [backend-tfjs/src/agents/qtable.ts:147](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L147)

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

Defined in: [backend-tfjs/src/agents/qtable.ts:191](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L191)

Serialize internal state (epsilon, stepCount, etc.) for checkpointing.

#### Returns

`Record`\<`string`, `unknown`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`getState`](../interfaces/AgentInterface.md#getstate)

***

### setState()

> **setState**(`state`): `void`

Defined in: [backend-tfjs/src/agents/qtable.ts:197](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L197)

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

Defined in: [backend-tfjs/src/agents/qtable.ts:205](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L205)

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

Defined in: [backend-tfjs/src/agents/qtable.ts:229](https://github.com/IgnitionAI/ignition/blob/98013cacf597d0fb1791d7687c2ae194434aed84/packages/backend-tfjs/src/agents/qtable.ts#L229)

Load a previously saved model and state.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`load`](../interfaces/AgentInterface.md#load)
