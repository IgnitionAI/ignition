/**
 * PPOAgent — Simplified Policy Gradient (REINFORCE with value baseline).
 *
 * Architecture:
 *   - Actor  : MLP → softmax → discrete action distribution
 *   - Critic : MLP → scalar state value V(s)
 *
 * Update rule:
 *   Experiences are buffered throughout an episode.
 *   When `done=true`, the agent computes discounted returns, normalises them,
 *   trains the critic (MSE on returns), then updates the actor with REINFORCE:
 *     loss = -E[ log π(a|s) * advantage ]  where advantage = G - V(s)
 *
 * The `train()` method is a no-op for mid-episode steps; the full update
 * happens only at episode boundaries (experience.done === true).
 */

import * as tf from '@tensorflow/tfjs';
import { Experience } from '../memory/ReplayBuffer';

export interface PPOConfig {
  inputSize: number;
  actionSize: number;
  /** Hidden layer sizes. Default: [64, 64] */
  hiddenLayers?: number[];
  /** Discount factor γ. Default: 0.99 */
  gamma?: number;
  /** Actor learning rate. Default: 0.001 */
  actorLr?: number;
  /** Critic learning rate. Default: 0.001 */
  criticLr?: number;
}

function buildNet(
  inputSize: number,
  outputSize: number,
  hiddenLayers: number[],
  outputActivation: string,
  lr: number,
): tf.Sequential {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      units: hiddenLayers[0],
      inputShape: [inputSize],
      activation: 'relu',
    }),
  );
  for (let i = 1; i < hiddenLayers.length; i++) {
    model.add(tf.layers.dense({ units: hiddenLayers[i], activation: 'relu' }));
  }
  model.add(
    tf.layers.dense({ units: outputSize, activation: outputActivation as any }),
  );
  model.compile({
    optimizer: tf.train.adam(lr),
    loss: outputActivation === 'linear' ? 'meanSquaredError' : 'categoricalCrossentropy',
  });
  return model;
}

export class PPOAgent {
  private actorNet: tf.Sequential;
  private criticNet: tf.Sequential;
  private episodeBuffer: Experience[] = [];
  private gamma: number;
  private actorLr: number;
  private actionSize: number;

  constructor(config: PPOConfig) {
    const layers = config.hiddenLayers ?? [64, 64];
    this.gamma = config.gamma ?? 0.99;
    this.actorLr = config.actorLr ?? 0.001;
    this.actionSize = config.actionSize;

    // Actor outputs a softmax distribution over actions
    this.actorNet = buildNet(config.inputSize, config.actionSize, layers, 'softmax', this.actorLr);
    // Critic outputs a single scalar V(s)
    this.criticNet = buildNet(config.inputSize, 1, layers, 'linear', config.criticLr ?? 0.001);
  }

  /** Sample an action from the actor's policy distribution. */
  async getAction(observation: number[]): Promise<number> {
    const stateTensor = tf.tensor2d([observation]);
    const probs = this.actorNet.predict(stateTensor) as tf.Tensor;
    const probsArray = (probs.arraySync() as number[][])[0];
    tf.dispose([stateTensor, probs]);

    // Categorical sampling
    const r = Math.random();
    let cumsum = 0;
    for (let i = 0; i < probsArray.length; i++) {
      cumsum += probsArray[i];
      if (r <= cumsum) return i;
    }
    return probsArray.length - 1;
  }

  /** Buffer the experience for the current episode. */
  remember(experience: Experience): void {
    this.episodeBuffer.push(experience);
  }

  /**
   * No-op for mid-episode steps.
   * When the last buffered experience has done=true, runs a full REINFORCE update
   * on the buffered episode and clears the buffer.
   */
  async train(): Promise<void> {
    if (this.episodeBuffer.length === 0) return;

    const last = this.episodeBuffer[this.episodeBuffer.length - 1];
    if (!last.done) return; // wait until episode boundary

    // ── 1. Compute discounted returns ──────────────────────────────────────
    const n = this.episodeBuffer.length;
    const returns: number[] = new Array(n);
    let G = 0;
    for (let i = n - 1; i >= 0; i--) {
      G = this.episodeBuffer[i].reward + this.gamma * G;
      returns[i] = G;
    }

    // ── 2. Normalise returns ────────────────────────────────────────────────
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance) + 1e-8;
    const normalised = returns.map(r => (r - mean) / std);

    const states = this.episodeBuffer.map(e => e.state);
    const actions = this.episodeBuffer.map(e => e.action);

    // ── 3. Train critic (V(s) → discounted return) ─────────────────────────
    const statesTensor = tf.tensor2d(states);
    const targetsTensor = tf.tensor2d(returns.map(r => [r]));
    await this.criticNet.fit(statesTensor, targetsTensor, {
      epochs: 1,
      verbose: 0,
    });

    // ── 4. Compute advantages using critic baseline ────────────────────────
    const valuesPred = this.criticNet.predict(statesTensor) as tf.Tensor2D;
    const valuesArr = (valuesPred.arraySync() as number[][]).map(v => v[0]);
    tf.dispose([statesTensor, targetsTensor, valuesPred]);

    const advantages = normalised.map((g, i) => g - valuesArr[i]);

    // ── 5. REINFORCE actor update ──────────────────────────────────────────
    const actorOptimizer = tf.train.adam(this.actorLr);
    actorOptimizer.minimize(() => {
      const st = tf.tensor2d(states);
      const logProbs = tf.log(
        (this.actorNet.predict(st) as tf.Tensor2D).add(1e-8),
      );

      // Gather log prob of taken action for each step
      const oneHot = tf.oneHot(
        tf.tensor1d(actions, 'int32'),
        this.actionSize,
      );
      const selectedLogProbs = logProbs.mul(oneHot).sum(1);

      const advTensor = tf.tensor1d(advantages);
      // Negative because we minimise the loss
      const loss = selectedLogProbs.mul(advTensor).mean().neg() as tf.Scalar;

      tf.dispose([st, logProbs, oneHot, selectedLogProbs, advTensor]);
      return loss;
    });

    // ── 6. Clear episode buffer ─────────────────────────────────────────────
    this.episodeBuffer = [];
  }

  dispose(): void {
    this.actorNet.dispose();
    this.criticNet.dispose();
  }
}
