import * as tf from '@tensorflow/tfjs';

/**
 * Build a simple Q-network with a Sequential model.
 *
 * @param inputSize The size of the input (state dimension)
 * @param outputSize The number of actions (output dimension)
 * @param hiddenLayers Optional array defining the number of units in hidden layers.
 *                     Default is [24, 24].
 * @param lr Learning rate. Default is 0.001.
 * @returns A compiled tf.Sequential model.
 */
export function buildQNetwork(
  inputSize: number,
  outputSize: number,
  hiddenLayers: number[] = [24, 24],
  lr: number = 0.001,
  seed?: number
): tf.Sequential {
  const model = tf.sequential();

  // Input layer
  model.add(tf.layers.dense({
    inputShape: [inputSize],
    ...(seed === undefined ? {} : {kernelInitializer: tf.initializers.glorotUniform({seed})}),
    units: hiddenLayers[0],
    activation: 'relu',
  }));

  // Additional hidden layers if any
  for (let i = 1; i < hiddenLayers.length; i++) {
    model.add(tf.layers.dense({
      units: hiddenLayers[i],
      ...(seed === undefined ? {} : {kernelInitializer: tf.initializers.glorotUniform({seed: seed + i})}),
      activation: 'relu',
    }));
  }

  // Output layer (linear activation for Q-values)
  model.add(tf.layers.dense({
    units: outputSize,
    ...(seed === undefined ? {} : {kernelInitializer: tf.initializers.glorotUniform({seed: seed + hiddenLayers.length})}),
    activation: 'linear',
  }));

  model.compile({
    optimizer: tf.train.adam(lr),
    loss: 'meanSquaredError',
  });

  return model;
}
