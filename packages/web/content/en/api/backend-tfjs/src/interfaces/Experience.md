[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / Experience

# Interface: Experience

Defined in: core/dist/types.d.ts:20

## Properties

### state

> **state**: `number`[]

Defined in: core/dist/types.d.ts:21

***

### action

> **action**: `number` \| `number`[]

Defined in: core/dist/types.d.ts:22

***

### reward

> **reward**: `number`

Defined in: core/dist/types.d.ts:23

***

### nextState

> **nextState**: `number`[]

Defined in: core/dist/types.d.ts:24

***

### terminated

> **terminated**: `boolean`

Defined in: core/dist/types.d.ts:26

True when the episode ended due to a terminal condition (agent failed, goal reached…)

***

### truncated

> **truncated**: `boolean`

Defined in: core/dist/types.d.ts:28

True when the episode ended due to a time/step limit, not a terminal condition

***

### info?

> `optional` **info?**: `Record`\<`string`, `unknown`\>

Defined in: core/dist/types.d.ts:29
