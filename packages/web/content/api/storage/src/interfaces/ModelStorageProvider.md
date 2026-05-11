[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [storage/src](../README.md) / ModelStorageProvider

# Interface: ModelStorageProvider

Defined in: [storage/src/types.ts:10](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/types.ts#L10)

## Methods

### save()

> **save**(`modelId`, `model`, `metadata?`): `Promise`\<`string`\>

Defined in: [storage/src/types.ts:14](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/types.ts#L14)

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

***

### load()

> **load**(`modelId`): `Promise`\<`LayersModel`\>

Defined in: [storage/src/types.ts:23](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/types.ts#L23)

Load a previously saved model by its ID.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`LayersModel`\>

***

### list()

> **list**(): `Promise`\<[`ModelInfo`](ModelInfo.md)[]\>

Defined in: [storage/src/types.ts:28](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/types.ts#L28)

List all models stored by this provider.

#### Returns

`Promise`\<[`ModelInfo`](ModelInfo.md)[]\>

***

### delete()

> **delete**(`modelId`): `Promise`\<`void`\>

Defined in: [storage/src/types.ts:33](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/types.ts#L33)

Delete a model and its associated files.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`void`\>

***

### exists()

> **exists**(`modelId`): `Promise`\<`boolean`\>

Defined in: [storage/src/types.ts:38](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/types.ts#L38)

Return true if a model with the given ID exists.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`boolean`\>
