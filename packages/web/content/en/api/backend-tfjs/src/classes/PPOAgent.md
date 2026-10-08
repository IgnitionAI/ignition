[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / PPOAgent

# Class: PPOAgent

Defined in: [backend-tfjs/src/agents/ppo.ts:96](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L96)

## Implements

- [`AgentInterface`](../interfaces/AgentInterface.md)

## Constructors

### Constructor

> **new PPOAgent**(`config`): `PPOAgent`

Defined in: [backend-tfjs/src/agents/ppo.ts:132](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L132)

#### Parameters

##### config

[`PPOConfig`](../interfaces/PPOConfig.md)

#### Returns

`PPOAgent`

## Methods

### getAction()

> **getAction**(`state`, `greedy?`): `Promise`\<`number`\>

Defined in: [backend-tfjs/src/agents/ppo.ts:177](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L177)

Sélectionner une action par échantillonnage stochastique depuis π_θ.
Stocke lastLogProb et lastValue pour le prochain remember().

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

Defined in: [backend-tfjs/src/agents/ppo.ts:209](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L209)

Stocker une transition dans le buffer de rollout.
Doit être appelé immédiatement après getAction() pour que
lastLogProb et lastValue correspondent bien à cet état.

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

Defined in: [backend-tfjs/src/agents/ppo.ts:223](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L223)

Mettre à jour l'acteur et le critic sur les données collectées.
Vide le buffer de rollout à la fin (algorithme on-policy).

Appelé typiquement à la fin de chaque épisode ou après N steps.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`train`](../interfaces/AgentInterface.md#train)

***

### getState()

> **getState**(): `Record`\<`string`, `unknown`\>

Defined in: [backend-tfjs/src/agents/ppo.ts:427](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L427)

Serialize internal state (epsilon, stepCount, etc.) for checkpointing.

#### Returns

`Record`\<`string`, `unknown`\>

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`getState`](../interfaces/AgentInterface.md#getstate)

***

### setState()

> **setState**(`state`): `void`

Defined in: [backend-tfjs/src/agents/ppo.ts:434](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L434)

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

Defined in: [backend-tfjs/src/agents/ppo.ts:439](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L439)

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

Defined in: [backend-tfjs/src/agents/ppo.ts:452](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L452)

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

Defined in: [backend-tfjs/src/agents/ppo.ts:464](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/agents/ppo.ts#L464)

Release TF/GPU/WASM resources held by the agent

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../interfaces/AgentInterface.md).[`dispose`](../interfaces/AgentInterface.md#dispose)
