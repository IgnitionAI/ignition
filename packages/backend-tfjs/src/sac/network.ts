import * as tf from '@tensorflow/tfjs';

export interface NetworkWeights { shape: number[]; values: number[] }

/** Dense networks own their variables; optimizers receive explicit variable lists. */
export class SACNetwork {
  readonly variables: tf.Variable[] = [];
  constructor(sizes: number[], seed: number) {
    for (let i = 0; i < sizes.length - 1; i++) {
      const input = sizes[i], output = sizes[i + 1], limit = Math.sqrt(6 / (input + output));
      const pair = tf.tidy(() => [
        tf.variable(tf.randomUniform([input, output], -limit, limit, 'float32', seed + i)),
        tf.variable(tf.zeros([output])),
      ]);
      this.variables.push(...pair);
    }
  }
  forward(input: tf.Tensor2D): tf.Tensor2D {
    let output = input;
    for (let i = 0; i < this.variables.length; i += 2) {
      output = output.matMul(this.variables[i]).add(this.variables[i + 1]) as tf.Tensor2D;
      if (i + 2 < this.variables.length) output = output.relu();
    }
    return output;
  }
  snapshot(): NetworkWeights[] {
    return this.variables.map(variable => ({ shape: [...variable.shape], values: Array.from(variable.dataSync()) }));
  }
  copyFrom(source: SACNetwork, tau = 1): void {
    tf.tidy(() => this.variables.forEach((variable, i) => {
      variable.assign(variable.mul(1 - tau).add(source.variables[i].mul(tau)));
    }));
  }
  dispose(): void { this.variables.forEach(variable => variable.dispose()); }
}
