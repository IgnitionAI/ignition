[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [storage/src](../README.md) / LocalStorageProvider

# Class: LocalStorageProvider

Defined in: [storage/src/providers/localstorage.ts:10](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/localstorage.ts#L10)

Browser-only provider that persists TF.js models in localStorage.
Good for small configs & metadata. Models > 5MB will fail.

## Implements

- [`ModelStorageProvider`](../interfaces/ModelStorageProvider.md)

## Constructors

### Constructor

> **new LocalStorageProvider**(): `LocalStorageProvider`

#### Returns

`LocalStorageProvider`

## Methods

### save()

> **save**(`modelId`, `model`, `metadata?`): `Promise`\<`string`\>

Defined in: [storage/src/providers/localstorage.ts:11](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/localstorage.ts#L11)

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

Defined in: [storage/src/providers/localstorage.ts:30](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/localstorage.ts#L30)

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

Defined in: [storage/src/providers/localstorage.ts:38](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/localstorage.ts#L38)

List all models stored by this provider.

#### Returns

`Promise`\<[`ModelInfo`](../interfaces/ModelInfo.md)[]\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`list`](../interfaces/ModelStorageProvider.md#list)

***

### delete()

> **delete**(`modelId`): `Promise`\<`void`\>

Defined in: [storage/src/providers/localstorage.ts:60](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/localstorage.ts#L60)

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

Defined in: [storage/src/providers/localstorage.ts:77](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/storage/src/providers/localstorage.ts#L77)

Return true if a model with the given ID exists.

#### Parameters

##### modelId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`ModelStorageProvider`](../interfaces/ModelStorageProvider.md).[`exists`](../interfaces/ModelStorageProvider.md#exists)
