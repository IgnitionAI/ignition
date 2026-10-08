[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [storage/src](../README.md) / HuggingFaceProvider

# Class: HuggingFaceProvider

Defined in: [storage/src/providers/huggingface.ts:29](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/huggingface.ts#L29)

## Implements

- [`ModelStorageProvider`](../interfaces/ModelStorageProvider.md)

## Constructors

### Constructor

> **new HuggingFaceProvider**(`config?`): `HuggingFaceProvider`

Defined in: [storage/src/providers/huggingface.ts:36](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/huggingface.ts#L36)

#### Parameters

##### config?

Explicit config object. When omitted, reads HF_TOKEN and
               HF_REPO_ID from process.env and validates with Zod.

###### token

`string` = `...`

###### repoId

`string` = `...`

#### Returns

`HuggingFaceProvider`

## Methods

### save()

> **save**(`modelId`, `model`, `metadata?`): `Promise`\<`string`\>

Defined in: [storage/src/providers/huggingface.ts:42](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/huggingface.ts#L42)

Serialize and persist a model. Returns the URI where it was stored.

#### Parameters

##### modelId

`string`

##### model

`LayersModel`

##### metadata?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`string`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`save`](../interfaces/ModelStorageProvider.md#save)

***

### load()

> **load**(`modelId`, `maxRetries?`, `initialDelay?`): `Promise`\<`LayersModel`\>

Defined in: [storage/src/providers/huggingface.ts:90](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/huggingface.ts#L90)

Load a previously saved model by its ID.

#### Parameters

##### modelId

`string`

##### maxRetries?

`number` = `3`

##### initialDelay?

`number` = `2000`

#### Returns

`Promise`\<`LayersModel`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`load`](../interfaces/ModelStorageProvider.md#load)

***

### list()

> **list**(): `Promise`\<[`ModelInfo`](../interfaces/ModelInfo.md)[]\>

Defined in: [storage/src/providers/huggingface.ts:119](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/huggingface.ts#L119)

List all models stored by this provider.

#### Returns

`Promise`\<[`ModelInfo`](../interfaces/ModelInfo.md)[]\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`list`](../interfaces/ModelStorageProvider.md#list)

***

### delete()

> **delete**(`modelId`): `Promise`\<`void`\>

Defined in: [storage/src/providers/huggingface.ts:149](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/huggingface.ts#L149)

Delete a model and its associated files.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`delete`](../interfaces/ModelStorageProvider.md#delete)

***

### exists()

> **exists**(`modelId`): `Promise`\<`boolean`\>

Defined in: [storage/src/providers/huggingface.ts:165](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/huggingface.ts#L165)

Return true if a model with the given ID exists.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`exists`](../interfaces/ModelStorageProvider.md#exists)
