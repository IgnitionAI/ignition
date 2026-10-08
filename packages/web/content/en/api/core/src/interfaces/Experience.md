[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / Experience

# Interface: Experience

Defined in: [core/src/types.ts:29](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L29)

## Properties

### state

> **state**: `number`[]

Defined in: [core/src/types.ts:30](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L30)

***

### action

> **action**: `number` \| `number`[]

Defined in: [core/src/types.ts:31](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L31)

***

### reward

> **reward**: `number`

Defined in: [core/src/types.ts:32](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L32)

***

### nextState

> **nextState**: `number`[]

Defined in: [core/src/types.ts:33](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L33)

***

### terminated

> **terminated**: `boolean`

Defined in: [core/src/types.ts:35](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L35)

True when the episode ended due to a terminal condition (agent failed, goal reached…)

***

### truncated

> **truncated**: `boolean`

Defined in: [core/src/types.ts:37](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L37)

True when the episode ended due to a time/step limit, not a terminal condition

***

### info?

> `optional` **info?**: `Record`\<`string`, `unknown`\>

Defined in: [core/src/types.ts:38](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L38)
