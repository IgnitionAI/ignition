[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [storage/src](../README.md) / IndexedDBProvider

# Class: IndexedDBProvider

Defined in: [storage/src/providers/indexeddb.ts:10](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/indexeddb.ts#L10)

Browser-only provider that persists TF.js models in IndexedDB.
Best for models > 5MB (localStorage quota).

## Implements

- [`ModelStorageProvider`](../interfaces/ModelStorageProvider.md)

## Constructors

### Constructor

> **new IndexedDBProvider**(): `IndexedDBProvider`

#### Returns

`IndexedDBProvider`

## Methods

### save()

> **save**(`modelId`, `model`, `metadata?`): `Promise`\<`string`\>

Defined in: [storage/src/providers/indexeddb.ts:11](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/indexeddb.ts#L11)

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

> **load**(`modelId`): `Promise`\<`LayersModel`\>

Defined in: [storage/src/providers/indexeddb.ts:30](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/indexeddb.ts#L30)

Load a previously saved model by its ID.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`LayersModel`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`load`](../interfaces/ModelStorageProvider.md#load)

***

### list()

> **list**(): `Promise`\<[`ModelInfo`](../interfaces/ModelInfo.md)[]\>

Defined in: [storage/src/providers/indexeddb.ts:38](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/indexeddb.ts#L38)

List all models stored by this provider.

#### Returns

`Promise`\<[`ModelInfo`](../interfaces/ModelInfo.md)[]\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`list`](../interfaces/ModelStorageProvider.md#list)

***

### delete()

> **delete**(`modelId`): `Promise`\<`void`\>

Defined in: [storage/src/providers/indexeddb.ts:62](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/indexeddb.ts#L62)

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

Defined in: [storage/src/providers/indexeddb.ts:69](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/indexeddb.ts#L69)

Return true if a model with the given ID exists.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`exists`](../interfaces/ModelStorageProvider.md#exists)
