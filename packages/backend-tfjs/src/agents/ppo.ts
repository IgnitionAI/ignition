import * as tf from '@tensorflow/tfjs';

import { Experience } from '../memory/ReplayBuffer';
import { RolloutBuffer } from '../memory/RolloutBuffer';
import { buildActorCritic } from '../model/BuildActorCritic';
import { PPOConfig } from '../types';

export class PPOAgent {
  private model: tf.LayersModel;
  private rolloutBuffer: RolloutBuffer;
  private clipRatio: number;
  private gaeLambda: number;
  private entropyCoeff: number;
  private valueLossCoeff: number;
  private gamma: number;
  private nSteps: number;
  private batchSize: number;
  private epochs: number;
  private actionSize: number;

  constructor(config: PPOConfig) {
    const {
      inputSize,
      actionSize,
      hiddenLayers = [64, 64],
      clipRatio = 0.2,
      gaeLambda = 0.95,
      entropyCoeff = 0.01,
      valueLossCoeff = 0.5,
      lr = 0.0003,
      nSteps = 128,
      batchSize = 64,
      epochs = 4,
      gamma = 0.99,
    } = config;

    this.actionSize = actionSize;
    this.clipRatio = clipRatio;
    this.gaeLambda = gaeLambda;
    this.entropyCoeff = entropyCoeff;
    this.valueLossCoeff = valueLossCoeff;
    this.gamma = gamma;
    this.nSteps = nSteps;
    this.batchSize = batchSize;
    this.epochs = epochs;

    this.model = buildActorCritic(inputSize, actionSize, hiddenLayers, lr);
    this.rolloutBuffer = new RolloutBuffer(nSteps);
  }

  async getAction(state: number[]): Promise<number> {
    return tf.tidy(() => {
      const stateTensor = tf.tensor2d([state]);
      const [policyTensor] = this.model.predict(stateTensor) as tf.Tensor[];
      const probs = policyTensor.dataSync() as Float32Array;

      // Sample from categorical distribution
      const rand = Math.random();
      let cumulative = 0;
      for (let i = 0; i < probs.length; i++) {
        cumulative += probs[i];
        if (rand < cumulative) return i;
      }
      return probs.length - 1;
    });
  }

  remember(exp: Experience): void {
    // Compute value and logProb for this state/action using current policy
    const { value, logProb } = tf.tidy(() => {
      const stateTensor = tf.tensor2d([exp.state]);
      const [policyTensor, valueTensor] = this.model.predict(
        stateTensor
      ) as tf.Tensor[];

      const probs = policyTensor.dataSync() as Float32Array;
      const v = valueTensor.dataSync()[0];
      const lp = Math.log(Math.max(probs[exp.action], 1e-8));

      return { value: v, logProb: lp };
    });

    this.rolloutBuffer.add(
      exp.state,
      exp.action,
      exp.reward,
      value,
      logProb,
      exp.done
    );
  }

  async train(): Promise<void> {
    if (!this.rolloutBuffer.isFull()) return;

    const data = this.rolloutBuffer.getData();
    const { advantages, returns } = this.rolloutBuffer.computeAdvantagesAndReturns(
      this.gamma,
      this.gaeLambda
    );

    // Normalize advantages
    const advMean =
      advantages.reduce((s, a) => s + a, 0) / advantages.length;
    const advStd = Math.sqrt(
      advantages.reduce((s, a) => s + (a - advMean) ** 2, 0) /
        advantages.length
    ) || 1;
    const normalizedAdvantages = advantages.map(a => (a - advMean) / advStd);

    const n = data.states.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      // Shuffle indices
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      // Mini-batch training
      for (let start = 0; start < n; start += this.batchSize) {
        const end = Math.min(start + this.batchSize, n);
        const batchIndices = indices.slice(start, end);

        const batchStates = batchIndices.map(i => data.states[i]);
        const batchActions = batchIndices.map(i => data.actions[i]);
        const batchOldLogProbs = batchIndices.map(i => data.logProbs[i]);
        const batchAdvantages = batchIndices.map(i => normalizedAdvantages[i]);
        const batchReturns = batchIndices.map(i => returns[i]);

        await this.trainMiniBatch(
          batchStates,
          batchActions,
          batchOldLogProbs,
          batchAdvantages,
          batchReturns
        );
      }
    }

    this.rolloutBuffer.clear();
  }

  private async trainMiniBatch(
    states: number[][],
    actions: number[],
    oldLogProbs: number[],
    advantages: number[],
    returns: number[]
  ): Promise<void> {
    const statesTensor = tf.tensor2d(states);
    const actionsTensor = tf.tensor1d(actions, 'int32');
    const oldLogProbsTensor = tf.tensor1d(oldLogProbs);
    const advantagesTensor = tf.tensor1d(advantages);
    const returnsTensor = tf.tensor1d(returns);

    const optimizer = this.model.optimizer as tf.Optimizer;

    const loss = optimizer.minimize(() => {
      return tf.tidy(() => {
        const [policyTensor, valueTensor] = this.model.apply(
          statesTensor,
          { training: true }
        ) as tf.Tensor[];

        const values = valueTensor.squeeze([1]);

        // Log probs of taken actions
        const actionOneHot = tf.oneHot(actionsTensor, this.actionSize);
        const selectedProbs = policyTensor.mul(actionOneHot).sum(1);
        const newLogProbs = selectedProbs.add(1e-8).log();

        // PPO clipped surrogate
        const ratio = newLogProbs.sub(oldLogProbsTensor).exp();
        const surr1 = ratio.mul(advantagesTensor);
        const surr2 = ratio
          .clipByValue(1 - this.clipRatio, 1 + this.clipRatio)
          .mul(advantagesTensor);
        const policyLoss = tf.minimum(surr1, surr2).mean().neg();

        // Value loss
        const valueLoss = values
          .sub(returnsTensor)
          .square()
          .mean()
          .mul(this.valueLossCoeff);

        // Entropy bonus
        const entropy = policyTensor
          .add(1e-8)
          .log()
          .mul(policyTensor)
          .sum(1)
          .mean()
          .mul(this.entropyCoeff);

        return policyLoss.add(valueLoss).add(entropy) as tf.Scalar;
      });
    }, true);

    if (loss) loss.dispose();

    tf.dispose([
      statesTensor,
      actionsTensor,
      oldLogProbsTensor,
      advantagesTensor,
      returnsTensor,
    ]);
  }

  dispose(): void {
    this.model.dispose();
    this.rolloutBuffer.clear();
  }
}
