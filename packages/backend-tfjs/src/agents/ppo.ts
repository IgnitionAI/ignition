import * as tf from '@tensorflow/tfjs';

import { Experience } from '../memory/ReplayBuffer';
import { RolloutBuffer } from '../memory/RolloutBuffer';
import { buildActorCritic } from '../model/BuildActorCritic';
import { PPOConfig } from '../types';

export interface PPOActionResult {
  action: number;
  logProb: number;
  value: number;
}

export interface PPOTransition {
  state: number[];
  action: number;
  reward: number;
  logProb: number;
  value: number;
  done: boolean;
}

export interface PPOTrainingMetrics {
  policyLoss: number;
  valueLoss: number;
  entropy: number;
}

export class PPOAgent {
  private model: tf.LayersModel;
  private rolloutBuffer: RolloutBuffer;
  private clipRatio: number;
  private gaeLambda: number;
  private entropyCoeff: number;
  private valueCoeff: number;
  private valueLossCoeff: number;
  private gamma: number;
  private nSteps: number;
  private maxTrajectoryLength: number;
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
      lr = 0.0003,
      batchSize = 64,
      epochs = 4,
      gamma = 0.99,
    } = config;

    const valueLossCoeff = config.valueLossCoeff ?? config.valueCoeff ?? 0.5;
    const trajectoryLength = config.nSteps ?? config.maxTrajectoryLength ?? 128;

    this.actionSize = actionSize;
    this.clipRatio = clipRatio;
    this.gaeLambda = gaeLambda;
    this.entropyCoeff = entropyCoeff;
    this.valueCoeff = valueLossCoeff;
    this.valueLossCoeff = valueLossCoeff;
    this.gamma = gamma;
    this.nSteps = trajectoryLength;
    this.maxTrajectoryLength = trajectoryLength;
    this.batchSize = batchSize;
    this.epochs = epochs;

    this.model = buildActorCritic(inputSize, actionSize, hiddenLayers, lr);
    this.rolloutBuffer = new RolloutBuffer(trajectoryLength);
  }

  async getAction(state: number[]): Promise<PPOActionResult> {
    return tf.tidy(() => {
      const stateTensor = tf.tensor2d([state]);
      const [policyTensor, valueTensor] = this.model.predict(stateTensor) as tf.Tensor[];
      const probs = policyTensor.dataSync() as Float32Array;
      const value = valueTensor.dataSync()[0];

      const rand = Math.random();
      let cumulative = 0;
      for (let i = 0; i < probs.length; i++) {
        cumulative += probs[i];
        if (rand < cumulative) {
          return {
            action: i,
            logProb: Math.log(Math.max(probs[i], 1e-8)),
            value,
          };
        }
      }

      const action = probs.length - 1;
      return {
        action,
        logProb: Math.log(Math.max(probs[action], 1e-8)),
        value,
      };
    });
  }

  remember(exp: Experience): void {
    const { value, logProb } = this.getValueAndLogProb(exp.state, exp.action);
    this.storeTransition({
      state: exp.state,
      action: exp.action,
      reward: exp.reward,
      logProb,
      value,
      done: exp.done,
    });
  }

  storeTransition(transition: PPOTransition): void {
    this.rolloutBuffer.add(
      transition.state,
      transition.action,
      transition.reward,
      transition.value,
      transition.logProb,
      transition.done
    );
  }

  getTrajectoryLength(): number {
    return this.rolloutBuffer.size();
  }

  reset(): void {
    this.rolloutBuffer.clear();
  }

  async train(lastValue: number = 0): Promise<PPOTrainingMetrics | null> {
    if (!this.rolloutBuffer.isFull()) return null;

    const data = this.rolloutBuffer.getData();
    const { advantages, returns } = this.rolloutBuffer.computeAdvantagesAndReturns(
      this.gamma,
      this.gaeLambda,
      lastValue
    );

    const advMean = advantages.reduce((sum, value) => sum + value, 0) / advantages.length;
    const advStd = Math.sqrt(
      advantages.reduce((sum, value) => sum + (value - advMean) ** 2, 0) / advantages.length
    ) || 1;
    const normalizedAdvantages = advantages.map(value => (value - advMean) / advStd);

    const indices = Array.from({ length: data.states.length }, (_, index) => index);
    const metricsTotal = { policyLoss: 0, valueLoss: 0, entropy: 0 };
    let batchCount = 0;

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      for (let start = 0; start < data.states.length; start += this.batchSize) {
        const batchIndices = indices.slice(start, Math.min(start + this.batchSize, data.states.length));
        const metrics = await this.trainMiniBatch(
          batchIndices.map(index => data.states[index]),
          batchIndices.map(index => data.actions[index]),
          batchIndices.map(index => data.logProbs[index]),
          batchIndices.map(index => normalizedAdvantages[index]),
          batchIndices.map(index => returns[index])
        );

        metricsTotal.policyLoss += metrics.policyLoss;
        metricsTotal.valueLoss += metrics.valueLoss;
        metricsTotal.entropy += metrics.entropy;
        batchCount += 1;
      }
    }

    this.reset();

    if (batchCount === 0) {
      return { policyLoss: 0, valueLoss: 0, entropy: 0 };
    }

    return {
      policyLoss: metricsTotal.policyLoss / batchCount,
      valueLoss: metricsTotal.valueLoss / batchCount,
      entropy: metricsTotal.entropy / batchCount,
    };
  }

  dispose(): void {
    this.model.dispose();
    this.reset();
  }

  private getValueAndLogProb(
    state: number[],
    action: number
  ): Pick<PPOActionResult, 'value' | 'logProb'> {
    return tf.tidy(() => {
      const stateTensor = tf.tensor2d([state]);
      const [policyTensor, valueTensor] = this.model.predict(stateTensor) as tf.Tensor[];
      const probs = policyTensor.dataSync() as Float32Array;

      return {
        value: valueTensor.dataSync()[0],
        logProb: Math.log(Math.max(probs[action], 1e-8)),
      };
    });
  }

  private async trainMiniBatch(
    states: number[][],
    actions: number[],
    oldLogProbs: number[],
    advantages: number[],
    returns: number[]
  ): Promise<PPOTrainingMetrics> {
    const statesTensor = tf.tensor2d(states);
    const actionsTensor = tf.tensor1d(actions, 'int32');
    const oldLogProbsTensor = tf.tensor1d(oldLogProbs);
    const advantagesTensor = tf.tensor1d(advantages);
    const returnsTensor = tf.tensor1d(returns);

    const optimizer = this.model.optimizer as tf.Optimizer;
    let metrics: PPOTrainingMetrics = {
      policyLoss: 0,
      valueLoss: 0,
      entropy: 0,
    };

    const loss = optimizer.minimize(() => {
      return tf.tidy(() => {
        const [policyTensor, valueTensor] = this.model.apply(statesTensor, {
          training: true,
        }) as tf.Tensor[];
        const values = valueTensor.squeeze([1]);
        const actionOneHot = tf.oneHot(actionsTensor, this.actionSize);
        const selectedProbs = policyTensor.mul(actionOneHot).sum(1);
        const newLogProbs = selectedProbs.add(1e-8).log();
        const ratio = newLogProbs.sub(oldLogProbsTensor).exp();
        const clippedRatio = ratio.clipByValue(1 - this.clipRatio, 1 + this.clipRatio);
        const policyLoss = tf.minimum(
          ratio.mul(advantagesTensor),
          clippedRatio.mul(advantagesTensor)
        ).mean().neg();
        const valueLoss = values.sub(returnsTensor).square().mean();
        const entropy = policyTensor
          .add(1e-8)
          .log()
          .mul(policyTensor)
          .sum(1)
          .mean()
          .neg();

        metrics = {
          policyLoss: policyLoss.dataSync()[0],
          valueLoss: valueLoss.dataSync()[0],
          entropy: entropy.dataSync()[0],
        };

        return policyLoss
          .add(valueLoss.mul(this.valueLossCoeff))
          .sub(entropy.mul(this.entropyCoeff)) as tf.Scalar;
      });
    }, true);

    loss?.dispose();
    tf.dispose([
      statesTensor,
      actionsTensor,
      oldLogProbsTensor,
      advantagesTensor,
      returnsTensor,
    ]);

    return metrics;
  }
}
