import * as tf from '@tensorflow/tfjs';

/**
 * Build an Actor-Critic model with a shared trunk and two output heads.
 *
 * @param inputSize Dimension of the state vector
 * @param actionSize Number of discrete actions
 * @param hiddenLayers Neurons per hidden layer (default: [64, 64])
 * @param lr Learning rate (default: 0.0003)
 * @returns A compiled tf.LayersModel with outputs: [policy (softmax), value (linear)]
 */
export function buildActorCritic(
  inputSize: number,
  actionSize: number,
  hiddenLayers: number[] = [64, 64],
  lr: number = 0.0003
): tf.LayersModel {
  const input = tf.input({ shape: [inputSize] });

  // Shared trunk
  let trunk: tf.SymbolicTensor = input;
  for (const units of hiddenLayers) {
    trunk = tf.layers
      .dense({ units, activation: 'relu' })
      .apply(trunk) as tf.SymbolicTensor;
  }

  // Policy head: softmax over discrete actions
  const policyLogits = tf.layers
    .dense({ units: actionSize, activation: 'softmax', name: 'policy' })
    .apply(trunk) as tf.SymbolicTensor;

  // Value head: single scalar
  const value = tf.layers
    .dense({ units: 1, activation: 'linear', name: 'value' })
    .apply(trunk) as tf.SymbolicTensor;

  const model = tf.model({
    inputs: input,
    outputs: [policyLogits, value],
  });

  model.compile({
    optimizer: tf.train.adam(lr),
    loss: ['categoricalCrossentropy', 'meanSquaredError'],
  });

  return model;
}
