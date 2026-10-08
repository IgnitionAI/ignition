[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / OnnxAgent

# Class: OnnxAgent

Defined in: [backend-onnx/src/agents/onnx-agent.ts:20](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L20)

Inference-only RL agent that loads a pre-trained .onnx model and runs forward passes.

Implements AgentInterface — remember() and train() are no-ops since this agent
is meant for production inference, not training.

Usage:
```ts
const agent = new OnnxAgent({ modelPath: './model.onnx', actionSize: 4 });
await agent.load();
const action = await agent.getAction([0.1, -0.3, 0.5, 0.2]);
agent.dispose();
```

## Implements

- [`AgentInterface`](../../../backend-tfjs/src/interfaces/AgentInterface.md)

## Constructors

### Constructor

> **new OnnxAgent**(`config`): `OnnxAgent`

Defined in: [backend-onnx/src/agents/onnx-agent.ts:24](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L24)

#### Parameters

##### config

###### modelPath

`string` \| `Uint8Array`\<`ArrayBuffer`\> \| `Buffer`\<`ArrayBufferLike`\> = `...`

Path to the .onnx model file, or a Buffer/Uint8Array for in-memory usage

###### actionSize

`number` = `...`

Number of discrete actions the agent can take

###### executionProviders?

`string`[] = `...`

ONNX execution providers in priority order

###### inputName?

`string` = `...`

Name of the input tensor in the ONNX graph

###### outputName?

`string` = `...`

Name of the output tensor in the ONNX graph (Q-values)

#### Returns

`OnnxAgent`

## Methods

### load()

> **load**(): `Promise`\<`void`\>

Defined in: [backend-onnx/src/agents/onnx-agent.ts:32](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L32)

Loads the ONNX model and creates the inference session.
Must be called before getAction().

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../../../backend-tfjs/src/interfaces/AgentInterface.md).[`load`](../../../backend-tfjs/src/interfaces/AgentInterface.md#load)

***

### getAction()

> **getAction**(`observation`): `Promise`\<`number`\>

Defined in: [backend-onnx/src/agents/onnx-agent.ts:44](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L44)

Runs a forward pass through the ONNX model and returns the greedy action (argmax of Q-values).

#### Parameters

##### observation

`number`[]

State vector as number array

#### Returns

`Promise`\<`number`\>

Discrete action index in [0, actionSize)

#### Implementation of

[`AgentInterface`](../../../backend-tfjs/src/interfaces/AgentInterface.md).[`getAction`](../../../backend-tfjs/src/interfaces/AgentInterface.md#getaction)

***

### remember()

> **remember**(`_experience`): `void`

Defined in: [backend-onnx/src/agents/onnx-agent.ts:64](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L64)

No-op — ONNX agents do not accumulate experience

#### Parameters

##### \_experience

[`Experience`](../../../backend-tfjs/src/interfaces/Experience.md)

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../../../backend-tfjs/src/interfaces/AgentInterface.md).[`remember`](../../../backend-tfjs/src/interfaces/AgentInterface.md#remember)

***

### train()

> **train**(): `Promise`\<`void`\>

Defined in: [backend-onnx/src/agents/onnx-agent.ts:67](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L67)

No-op — ONNX agents do not train

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`AgentInterface`](../../../backend-tfjs/src/interfaces/AgentInterface.md).[`train`](../../../backend-tfjs/src/interfaces/AgentInterface.md#train)

***

### inspect()

> **inspect**(): `object`

Defined in: [backend-onnx/src/agents/onnx-agent.ts:73](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L73)

Returns input/output tensor names for debugging.
Useful when the default inputName/outputName don't match your ONNX model.

#### Returns

`object`

##### inputs

> **inputs**: `string`[]

##### outputs

> **outputs**: `string`[]

***

### loadFromHub()

> **loadFromHub**(`repoId`, `filename?`): `Promise`\<`void`\>

Defined in: [backend-onnx/src/agents/onnx-agent.ts:85](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L85)

Downloads a .onnx file from HF Hub and loads it as the inference session.

#### Parameters

##### repoId

`string`

HF Hub repo (e.g. "salim4n/my-dqn-model")

##### filename?

`string` = `'model.onnx'`

Filename in the repo (default: "model.onnx")

#### Returns

`Promise`\<`void`\>

***

### dispose()

> **dispose**(): `void`

Defined in: [backend-onnx/src/agents/onnx-agent.ts:91](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/agents/onnx-agent.ts#L91)

Releases the ONNX inference session

#### Returns

`void`

#### Implementation of

[`AgentInterface`](../../../backend-tfjs/src/interfaces/AgentInterface.md).[`dispose`](../../../backend-tfjs/src/interfaces/AgentInterface.md#dispose)
