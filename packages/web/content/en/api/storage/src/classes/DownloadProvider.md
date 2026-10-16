[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [storage/src](../README.md) / DownloadProvider

# Class: DownloadProvider

Defined in: [storage/src/providers/download.ts:8](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/download.ts#L8)

Browser-only provider that triggers a file download of the model.
Write-only: save() works, load() throws.

## Implements

- [`ModelStorageProvider`](../interfaces/ModelStorageProvider.md)

## Constructors

### Constructor

> **new DownloadProvider**(): `DownloadProvider`

#### Returns

`DownloadProvider`

## Methods

### save()

> **save**(`modelId`, `model`, `metadata?`): `Promise`\<`string`\>

Defined in: [storage/src/providers/download.ts:9](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/download.ts#L9)

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

> **load**(): `Promise`\<`LayersModel`\>

Defined in: [storage/src/providers/download.ts:34](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/download.ts#L34)

Load a previously saved model by its ID.

#### Returns

`Promise`\<`LayersModel`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`load`](../interfaces/ModelStorageProvider.md#load)

***

### list()

> **list**(): `Promise`\<[`ModelInfo`](../interfaces/ModelInfo.md)[]\>

Defined in: [storage/src/providers/download.ts:42](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/download.ts#L42)

List all models stored by this provider.

#### Returns

`Promise`\<[`ModelInfo`](../interfaces/ModelInfo.md)[]\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`list`](../interfaces/ModelStorageProvider.md#list)

***

### delete()

> **delete**(): `Promise`\<`void`\>

Defined in: [storage/src/providers/download.ts:47](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/download.ts#L47)

Delete a model and its associated files.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`delete`](../interfaces/ModelStorageProvider.md#delete)

***

### exists()

> **exists**(): `Promise`\<`boolean`\>

Defined in: [storage/src/providers/download.ts:51](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/download.ts#L51)

Return true if a model with the given ID exists.

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`exists`](../interfaces/ModelStorageProvider.md#exists)
