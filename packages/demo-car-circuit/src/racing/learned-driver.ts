import * as tf from "@tensorflow/tfjs";
import { DRIVING_CONTRACT } from "./driving";
import { OBSERVATION_CONTRACT, OBSERVATION_SIZE } from "./observations";
import { Q_PROTOCOL } from "./q-protocol";
import { LEARNING_PROTOCOL } from "./learning-protocol";

export interface DriverCheckpoint {
  format: "ignition-driver-v1";
  algorithm: "imitation-mlp" | "dqn" | "double-dqn";
  driving: string;
  observation: string;
  protocol: string;
  seed: number;
  updates: number;
  samples: number;
  createdAt: string;
  weights: { shape: number[]; values: number[] }[];
  configuration?: Record<string, unknown>;
  evaluation?: unknown;
}
const SHAPES = [[20, 32], [32], [32, 32], [32], [32, 9], [9]];
/** A trained neural network. Inference contains no reference controller or fallback. */
export class LearnedDriver {
  private model: tf.Sequential;
  private optimizer: tf.Optimizer;
  updates = 0;
  samples = 0;
  constructor(readonly seed: number, readonly algorithm: DriverCheckpoint["algorithm"] = "imitation-mlp") {
    if (!Number.isSafeInteger(seed) || seed < 1 || seed > 1000000)
      throw new Error("Seed must be an integer from 1 to 1000000");
    this.model = tf.sequential();
    this.model.add(
      tf.layers.dense({
        inputShape: [OBSERVATION_SIZE],
        units: 32,
        activation: algorithm === "imitation-mlp" ? "tanh" : "relu",
        kernelInitializer: tf.initializers.glorotUniform({ seed }),
      }),
    );
    this.model.add(
      tf.layers.dense({
        units: 32,
        activation: algorithm === "imitation-mlp" ? "tanh" : "relu",
        kernelInitializer: tf.initializers.glorotUniform({ seed: seed + 1 }),
      }),
    );
    this.model.add(
      tf.layers.dense({
        units: 9,
        activation: algorithm === "imitation-mlp" ? "softmax" : "linear",
        kernelInitializer: tf.initializers.glorotUniform({ seed: seed + 2 }),
      }),
    );
    this.optimizer = tf.train.adam(algorithm === "imitation-mlp" ? 0.003 : Q_PROTOCOL.learningRate);
    this.model.compile({
      optimizer: this.optimizer,
      loss: algorithm === "imitation-mlp" ? "categoricalCrossentropy" : "meanSquaredError",
    });
  }
  get decisionInterval() { return this.algorithm === "imitation-mlp" ? 1 : Q_PROTOCOL.actionRepeat; }
  action(observation: number[]): number {
    if (
      observation.length !== OBSERVATION_SIZE ||
      !observation.every(Number.isFinite)
    )
      throw new Error("Invalid driving observation");
    return tf.tidy(() => {
      const values = (
        this.model.predict(tf.tensor2d([observation])) as tf.Tensor
      ).dataSync();
      return values.indexOf(Math.max(...values));
    });
  }
  async learn(
    observations: number[][],
    actions: number[],
    epochs = 1,
  ): Promise<number> {
    if (this.algorithm !== "imitation-mlp") throw new Error("Use Q-learning training for this driver");
    if (
      !observations.length ||
      observations.length !== actions.length ||
      actions.some((a) => !Number.isInteger(a) || a < 0 || a > 8)
    )
      throw new Error("Invalid training samples");
    const x = tf.tensor2d(observations),
      y = tf.tidy(() => tf.oneHot(tf.tensor1d(actions, "int32"), 9));
    try {
      const history = await this.model.fit(x, y, {
        epochs,
        batchSize: 128,
        shuffle: false,
        verbose: 0,
      });
      this.updates += epochs;
      this.samples += observations.length;
      return Number(history.history.loss.at(-1));
    } finally {
      x.dispose();
      y.dispose();
    }
  }
  exportCheckpoint(): DriverCheckpoint {
    return {
      configuration: this.algorithm === "imitation-mlp" ? {hiddenLayers:[32,32],learningRate:.003,batchSize:128,epochsPerRound:3,samplesPerRound:4096} : {...Q_PROTOCOL},
      format: "ignition-driver-v1",
      algorithm: this.algorithm,
      driving: DRIVING_CONTRACT.id,
      observation: OBSERVATION_CONTRACT,
      protocol: this.algorithm === "imitation-mlp" ? LEARNING_PROTOCOL.id : Q_PROTOCOL.id,
      seed: this.seed,
      updates: this.updates,
      samples: this.samples,
      createdAt: new Date().toISOString(),
      weights: this.model
        .getWeights()
        .map((t) => ({ shape: t.shape, values: Array.from(t.dataSync()) })),
    };
  }
  static fromCheckpoint(value: unknown): LearnedDriver {
    const c = value as DriverCheckpoint;
    if (
      !c ||
      c.format !== "ignition-driver-v1" ||
      !["imitation-mlp", "dqn", "double-dqn"].includes(c.algorithm) ||
      c.driving !== DRIVING_CONTRACT.id ||
      c.observation !== OBSERVATION_CONTRACT ||
      c.protocol !== (c.algorithm === "imitation-mlp" ? LEARNING_PROTOCOL.id : Q_PROTOCOL.id)
    )
      throw new Error("Incompatible driver contract");
    if (
      !Number.isInteger(c.seed) ||
      !Number.isInteger(c.updates) ||
      c.updates < 0 ||
      !Number.isInteger(c.samples) ||
      c.samples < 0
    )
      throw new Error("Invalid driver metadata");
    if (
      !Array.isArray(c.weights) ||
      c.weights.length !== SHAPES.length ||
      c.weights.some(
        (w, i) =>
          !w ||
          JSON.stringify(w.shape) !== JSON.stringify(SHAPES[i]) ||
          !Array.isArray(w.values) ||
          w.values.length !== SHAPES[i].reduce((a, b) => a * b, 1) ||
          !w.values.every(Number.isFinite),
      )
    )
      throw new Error("Invalid driver weights");
    const driver = new LearnedDriver(c.seed, c.algorithm);
    const weights = c.weights.map((w) => tf.tensor(w.values, w.shape));
    try {
      driver.model.setWeights(weights);
    } finally {
      tf.dispose(weights);
    }
    driver.updates = c.updates;
    driver.samples = c.samples;
    return driver;
  }
  dispose() {
    this.model.dispose();
    this.optimizer.dispose();
  }
}
