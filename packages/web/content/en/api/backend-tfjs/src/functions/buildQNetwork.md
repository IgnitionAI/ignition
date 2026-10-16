[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-tfjs/src](../README.md) / buildQNetwork

# Function: buildQNetwork()

> **buildQNetwork**(`inputSize`, `outputSize`, `hiddenLayers?`, `lr?`): `Sequential`

Defined in: [backend-tfjs/src/model/BuildMLP.ts:13](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-tfjs/src/model/BuildMLP.ts#L13)

Build a simple Q-network with a Sequential model.

## Parameters

### inputSize

`number`

The size of the input (state dimension)

### outputSize

`number`

The number of actions (output dimension)

### hiddenLayers?

`number`[] = `...`

Optional array defining the number of units in hidden layers.
                    Default is [24, 24].

### lr?

`number` = `0.001`

Learning rate. Default is 0.001.

## Returns

`Sequential`

A compiled tf.Sequential model.
