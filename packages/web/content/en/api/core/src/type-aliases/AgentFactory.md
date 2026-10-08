[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [core/src](../README.md) / AgentFactory

# Type Alias: AgentFactory

> **AgentFactory** = (`config`) => [`AgentInterface`](../interfaces/AgentInterface.md)

Defined in: [core/src/types.ts:124](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/core/src/types.ts#L124)

Factory function that creates an agent from a merged config.
Used by IgnitionEnv.train() to auto-create agents.

## Parameters

### config

`Record`\<`string`, `unknown`\>

## Returns

[`AgentInterface`](../interfaces/AgentInterface.md)
