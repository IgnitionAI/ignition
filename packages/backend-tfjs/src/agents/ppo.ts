/**
 * Proximal Policy Optimization (PPO-Clip) — Actor-Critic
 *
 * Discrete: categorical policy over action indices.
 * Continuous: diagonal Gaussian in tanh space, then affine-mapped to [low, high].
 */

import * as tf from '@tensorflow/tfjs';
import { AgentInterface, Experience, PPOActionSpace, PPOConfig } from '../types';
import { PPOConfigSchema } from '../schemas';

interface RolloutEntry extends Experience {
  logProb: number;
  value: number;
  preTanh?: number[];
}

export interface GAEInput {
  rewards: number[];
  values: number[];
  nextValues: number[];
  terminated: boolean[];
  truncated: boolean[];
  gamma: number;
  gaeLambda: number;
  normalize: boolean;
}

export interface PPOUpdateStats {
  actorLoss: number;
  criticLoss: number;
  entropy: number;
  meanRatio: number;
  clipFraction: number;
}

export interface PPOActionDiagnostics {
  actionSpace: PPOActionSpace;
  action: number | number[];
  logProb: number;
  value: number;
}

export function clipSurrogate(ratio: number, advantage: number, clipRatio: number): number {
  const clipped = Math.min(Math.max(ratio, 1 - clipRatio), 1 + clipRatio);
  return Math.min(ratio * advantage, clipped * advantage);
}

export function computeGeneralizedAdvantages(input: GAEInput): {
  returns: number[];
  advantages: number[];
} {
  const n = input.rewards.length;
  const advantages = new Array<number>(n);
  const returns = new Array<number>(n);
  let lastGAE = 0;

  for (let t = n - 1; t >= 0; t--) {
    const bootstrapMask = input.terminated[t] ? 0 : 1;
    const traceMask = input.terminated[t] || input.truncated[t] ? 0 : 1;
    const delta =
      input.rewards[t] + input.gamma * input.nextValues[t] * bootstrapMask - input.values[t];
    lastGAE = delta + input.gamma * input.gaeLambda * traceMask * lastGAE;
    advantages[t] = lastGAE;
    returns[t] = lastGAE + input.values[t];
  }

  if (!input.normalize || n <= 1) {
    return { returns, advantages };
  }

  const mean = advantages.reduce((sum, value) => sum + value, 0) / n;
  const std =
    Math.sqrt(advantages.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n) + 1e-8;

  return {
    returns,
    advantages: std > 1e-8 ? advantages.map((value) => (value - mean) / std) : advantages,
  };
}

function sampleCategorical(probs: number[], random: () => number): number {
  const u = random();
  let cumsum = 0;
  for (let i = 0; i < probs.length; i++) {
    cumsum += probs[i];
    if (u < cumsum) return i;
  }
  return probs.length - 1;
}

function gaussianSample(random: () => number): number {
  const u1 = Math.max(random(), 1e-12);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function gaussianLogProb(preTanh: number[], mean: number[], logStd: number[]): number {
  let logProb = 0;
  for (let i = 0; i < preTanh.length; i++) {
    const std = Math.exp(logStd[i]);
    const z = (preTanh[i] - mean[i]) / std;
    logProb += -0.5 * (z * z + 2 * logStd[i] + Math.log(2 * Math.PI));
  }
  return logProb;
}

function tanhLogProbCorrection(preTanh: number[]): number {
  let correction = 0;
  for (const u of preTanh) {
    const squashed = Math.tanh(u);
    correction += Math.log(Math.max(1 - squashed * squashed, 1e-6));
  }
  return correction;
}

function affineFromTanh(tanhValue: number, low: number, high: number): number {
  return low + (tanhValue + 1) * 0.5 * (high - low);
}

function buildMLP(
  inputSize: number,
  outputSize: number,
  hiddenLayers: number[],
  seed?: number,
  seedOffset = 0,
): tf.Sequential {
  const model = tf.sequential();
  const initializer = (index: number) =>
    seed === undefined
      ? 'glorotUniform'
      : tf.initializers.glorotUniform({ seed: seed + seedOffset + index });
  model.add(
    tf.layers.dense({
      inputShape: [inputSize],
      units: hiddenLayers[0],
      activation: 'tanh',
      kernelInitializer: initializer(0),
    }),
  );
  for (let i = 1; i < hiddenLayers.length; i++) {
    model.add(
      tf.layers.dense({
        units: hiddenLayers[i],
        activation: 'tanh',
        kernelInitializer: initializer(i),
      }),
    );
  }
  model.add(
    tf.layers.dense({
      units: outputSize,
      activation: 'linear',
      kernelInitializer: initializer(hiddenLayers.length),
    }),
  );
  return model;
}

function trainableVars(net: tf.LayersModel): tf.Variable[] {
  return net.trainableWeights.map((w) => (w as unknown as { val: tf.Variable }).val);
}

export class PPOAgent implements AgentInterface {
  private actorNet: tf.LayersModel;
  private criticNet: tf.LayersModel;
  private logStd: tf.Variable | null = null;

  private actorOptimizer: tf.Optimizer;
  private criticOptimizer: tf.Optimizer;

  private rollout: RolloutEntry[] = [];
  private lastLogProb = 0;
  private lastValue = 0;
  private lastAction: number | number[] = 0;
  private lastPreTanh: number[] | undefined;
  private lastUpdateStats: PPOUpdateStats | null = null;

  private readonly gamma: number;
  private readonly gaeLambda: number;
  private readonly clipRatio: number;
  private readonly epochs: number;
  private readonly batchSize: number;
  private readonly entropyCoef: number;
  private readonly valueLossCoef: number;
  private readonly actionSize: number;
  private readonly actionSpace: PPOActionSpace;
  private readonly actionLow: number[];
  private readonly actionHigh: number[];
  private readonly random: () => number;
  private config: PPOConfig;
  private trainStepCounter = 0;
  private bestReward = -Infinity;

  constructor(config: PPOConfig) {
    const result = PPOConfigSchema.safeParse(config);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      throw new Error(`[PPOAgent] Invalid config: ${messages}`);
    }
    const {
      inputSize,
      actionSize,
      hiddenLayers = [64, 64],
      lr = 3e-4,
      gamma = 0.99,
      gaeLambda = 0.95,
      clipRatio = 0.2,
      epochs = 4,
      batchSize = 64,
      entropyCoef = 0.01,
      valueLossCoef = 0.5,
      actionSpace = 'discrete',
      seed,
    } = config;

    this.actionSize = actionSize;
    this.actionSpace = actionSpace;
    this.actionLow = config.actionLow ?? Array.from({ length: actionSize }, () => -1);
    this.actionHigh = config.actionHigh ?? Array.from({ length: actionSize }, () => 1);
    this.gamma = gamma;
    this.gaeLambda = gaeLambda;
    this.clipRatio = clipRatio;
    this.epochs = epochs;
    this.batchSize = batchSize;
    this.entropyCoef = entropyCoef;
    this.valueLossCoef = valueLossCoef;

    if (seed !== undefined) {
      let state = seed >>> 0;
      this.random = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      };
    } else {
      this.random = Math.random;
    }

    this.actorNet = buildMLP(inputSize, actionSize, hiddenLayers, seed, 0);
    this.criticNet = buildMLP(inputSize, 1, hiddenLayers, seed, 100);
    if (actionSpace === 'continuous') {
      this.logStd = tf.variable(tf.fill([actionSize], -0.5), true, 'ppo_log_std');
    }

    this.actorOptimizer = tf.train.adam(lr);
    this.criticOptimizer = tf.train.adam(lr);
    this.config = config;
  }

  async getAction(state: number[], greedy?: boolean): Promise<number | number[]> {
    switch (this.actionSpace) {
      case 'discrete':
        return this.getDiscreteAction(state, greedy === true);
      case 'continuous':
        return this.getContinuousAction(state, greedy === true);
      default: {
        const _exhaustive: never = this.actionSpace;
        throw new Error(`[PPOAgent] unsupported action space: ${String(_exhaustive)}`);
      }
    }
  }

  async getActionProbs(state: number[]): Promise<number[]> {
    if (this.actionSpace !== 'discrete') {
      throw new Error('[PPOAgent] getActionProbs is defined for discrete action spaces');
    }
    const stateTensor = tf.tensor2d([state]);
    try {
      const logits = this.actorNet.predict(stateTensor) as tf.Tensor2D;
      const probs = tf.softmax(logits);
      const data = (probs.arraySync() as number[][])[0];
      tf.dispose([logits, probs]);
      return data;
    } finally {
      stateTensor.dispose();
    }
  }

  getLastActionDiagnostics(): PPOActionDiagnostics {
    return {
      actionSpace: this.actionSpace,
      action: this.lastAction,
      logProb: this.lastLogProb,
      value: this.lastValue,
    };
  }

  getLastUpdateStats(): PPOUpdateStats | null {
    return this.lastUpdateStats;
  }

  getWeightFingerprint(): number[] {
    const parts: number[] = [];
    for (const tensor of [...this.actorNet.getWeights(), ...this.criticNet.getWeights()]) {
      parts.push(...Array.from(tensor.dataSync()));
    }
    if (this.logStd) {
      parts.push(...Array.from(this.logStd.dataSync()));
    }
    return parts;
  }

  remember(experience: Experience): void {
    this.rollout.push({
      ...experience,
      logProb: this.lastLogProb,
      value: this.lastValue,
      preTanh: this.lastPreTanh ? [...this.lastPreTanh] : undefined,
    });
  }

  discardRollout(): void {
    this.rollout = [];
  }

  shouldTrain(): boolean {
    return this.rollout.length >= (this.config.rolloutSize ?? 128);
  }

  async train(): Promise<void> {
    const n = this.rollout.length;
    if (n === 0) return;

    const { returns, advantages } = this.computeGAE();
    const states = this.rollout.map((entry) => entry.state);
    const actions = this.rollout.map((entry) => entry.action);
    const oldLogProbs = this.rollout.map((entry) => entry.logProb);
    const preTanh = this.rollout.map((entry) => entry.preTanh);

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      const indices = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      for (let start = 0; start < n; start += this.batchSize) {
        const mb = indices.slice(start, start + this.batchSize);
        if (mb.length === 0) continue;
        await this.updateMinibatch(
          mb.map((i) => states[i]),
          mb.map((i) => actions[i]),
          mb.map((i) => oldLogProbs[i]),
          mb.map((i) => advantages[i]),
          mb.map((i) => returns[i]),
          mb.map((i) => preTanh[i]),
        );
      }
    }

    this.rollout = [];
    this.trainStepCounter++;
  }

  private computeGAE(): { returns: number[]; advantages: number[] } {
    const nextValues = tf.tidy(() => {
      const states = tf.tensor2d(this.rollout.map((entry) => entry.nextState));
      return Array.from((this.criticNet.predict(states) as tf.Tensor).dataSync());
    });
    return computeGeneralizedAdvantages({
      rewards: this.rollout.map((entry) => entry.reward),
      values: this.rollout.map((entry) => entry.value),
      nextValues,
      terminated: this.rollout.map((entry) => entry.terminated),
      truncated: this.rollout.map((entry) => entry.truncated),
      gamma: this.gamma,
      gaeLambda: this.gaeLambda,
      normalize: true,
    });
  }

  private async getDiscreteAction(state: number[], greedy: boolean): Promise<number> {
    const stateTensor = tf.tensor2d([state]);
    try {
      const logits = this.actorNet.predict(stateTensor) as tf.Tensor2D;
      const probs = tf.softmax(logits);
      const probsData = (probs.arraySync() as number[][])[0];
      const valueTensor = this.criticNet.predict(stateTensor) as tf.Tensor2D;
      this.lastValue = (valueTensor.arraySync() as number[][])[0][0];
      const action = greedy
        ? probsData.indexOf(Math.max(...probsData))
        : sampleCategorical(probsData, this.random);
      this.lastLogProb = Math.log(Math.max(probsData[action], 1e-8));
      this.lastAction = action;
      this.lastPreTanh = undefined;
      tf.dispose([logits, probs, valueTensor]);
      return action;
    } finally {
      stateTensor.dispose();
    }
  }

  private async getContinuousAction(state: number[], greedy: boolean): Promise<number[]> {
    if (!this.logStd) {
      throw new Error('[PPOAgent] continuous policy is missing log-std');
    }
    const stateTensor = tf.tensor2d([state]);
    try {
      const meanTensor = this.actorNet.predict(stateTensor) as tf.Tensor2D;
      const mean = (meanTensor.arraySync() as number[][])[0];
      const logStd = Array.from(this.logStd.dataSync());
      const valueTensor = this.criticNet.predict(stateTensor) as tf.Tensor2D;
      this.lastValue = (valueTensor.arraySync() as number[][])[0][0];

      const preTanh = mean.map((mu, i) => {
        if (greedy) return mu;
        return mu + Math.exp(logStd[i]) * gaussianSample(this.random);
      });
      const action = preTanh.map((u, i) =>
        affineFromTanh(Math.tanh(u), this.actionLow[i], this.actionHigh[i]),
      );
      this.lastLogProb = gaussianLogProb(preTanh, mean, logStd) - tanhLogProbCorrection(preTanh);
      this.lastAction = action;
      this.lastPreTanh = preTanh;
      tf.dispose([meanTensor, valueTensor]);
      return action;
    } finally {
      stateTensor.dispose();
    }
  }

  private async updateMinibatch(
    states: number[][],
    actions: Array<number | number[]>,
    oldLogProbs: number[],
    advantages: number[],
    returns: number[],
    preTanh: Array<number[] | undefined>,
  ): Promise<void> {
    const statesTensor = tf.tensor2d(states);
    const oldLogProbsTensor = tf.tensor1d(oldLogProbs);
    const advantagesTensor = tf.tensor1d(advantages);
    const returnsTensor = tf.tensor1d(returns);
    const actorVars = [
      ...trainableVars(this.actorNet),
      ...(this.logStd ? [this.logStd] : []),
    ];
    const criticVars = trainableVars(this.criticNet);

    try {
      switch (this.actionSpace) {
        case 'discrete':
          this.minimizeDiscreteActor(
            statesTensor,
            actions.map((action) => action as number),
            oldLogProbsTensor,
            advantagesTensor,
            actorVars,
          );
          break;
        case 'continuous':
          this.minimizeContinuousActor(
            statesTensor,
            preTanh.map((value) => {
              if (!value) throw new Error('[PPOAgent] missing pre-tanh action in continuous rollout');
              return value;
            }),
            oldLogProbsTensor,
            advantagesTensor,
            actorVars,
          );
          break;
        default: {
          const _exhaustive: never = this.actionSpace;
          throw new Error(`[PPOAgent] unsupported action space: ${String(_exhaustive)}`);
        }
      }

      tf.tidy(() => {
        this.criticOptimizer.minimize(
          () => {
            const values = this.criticNet.apply(statesTensor, { training: true }) as tf.Tensor2D;
            const valuesSqueezed = values.squeeze([1]) as tf.Tensor1D;
            const valueLoss = tf.losses.meanSquaredError(returnsTensor, valuesSqueezed);
            return tf.mul(tf.scalar(this.valueLossCoef), valueLoss) as tf.Scalar;
          },
          false,
          criticVars,
        );
      });

      this.lastUpdateStats = this.readUpdateStats(
        statesTensor,
        actions,
        oldLogProbsTensor,
        advantagesTensor,
        returnsTensor,
        preTanh,
      );
    } finally {
      tf.dispose([statesTensor, oldLogProbsTensor, advantagesTensor, returnsTensor]);
    }
  }

  private minimizeDiscreteActor(
    statesTensor: tf.Tensor2D,
    actions: number[],
    oldLogProbsTensor: tf.Tensor1D,
    advantagesTensor: tf.Tensor1D,
    actorVars: tf.Variable[],
  ): void {
    const actionsTensor = tf.tensor1d(actions, 'int32');
    try {
      tf.tidy(() => {
        this.actorOptimizer.minimize(
          () => {
            const logits = this.actorNet.apply(statesTensor, { training: true }) as tf.Tensor2D;
            const { actorLoss, entropy } = this.discreteSurrogate(
              logits,
              actionsTensor,
              oldLogProbsTensor,
              advantagesTensor,
            );
            return tf.sub(actorLoss, tf.mul(tf.scalar(this.entropyCoef), entropy)) as tf.Scalar;
          },
          false,
          actorVars,
        );
      });
    } finally {
      actionsTensor.dispose();
    }
  }

  private minimizeContinuousActor(
    statesTensor: tf.Tensor2D,
    preTanh: number[][],
    oldLogProbsTensor: tf.Tensor1D,
    advantagesTensor: tf.Tensor1D,
    actorVars: tf.Variable[],
  ): void {
    if (!this.logStd) {
      throw new Error('[PPOAgent] continuous policy is missing log-std');
    }
    const preTanhTensor = tf.tensor2d(preTanh);
    try {
      tf.tidy(() => {
        this.actorOptimizer.minimize(
          () => {
            const mean = this.actorNet.apply(statesTensor, { training: true }) as tf.Tensor2D;
            const { actorLoss, entropy } = this.continuousSurrogate(
              mean,
              preTanhTensor,
              oldLogProbsTensor,
              advantagesTensor,
            );
            return tf.sub(actorLoss, tf.mul(tf.scalar(this.entropyCoef), entropy)) as tf.Scalar;
          },
          false,
          actorVars,
        );
      });
    } finally {
      preTanhTensor.dispose();
    }
  }

  private discreteSurrogate(
    logits: tf.Tensor2D,
    actionsTensor: tf.Tensor1D,
    oldLogProbsTensor: tf.Tensor1D,
    advantagesTensor: tf.Tensor1D,
  ): { actorLoss: tf.Scalar; entropy: tf.Scalar; ratio: tf.Tensor1D } {
    const probs = tf.softmax(logits);
    const logProbsAll = tf.log(tf.add(probs, 1e-8));
    const oneHot = tf.oneHot(actionsTensor, this.actionSize).cast('float32');
    const newLogProbs = tf.sum(tf.mul(logProbsAll, oneHot), 1);
    const ratio = tf.exp(tf.sub(newLogProbs, oldLogProbsTensor));
    const surr1 = tf.mul(ratio, advantagesTensor);
    const surr2 = tf.mul(
      tf.clipByValue(ratio, 1 - this.clipRatio, 1 + this.clipRatio),
      advantagesTensor,
    );
    const actorLoss = tf.neg(tf.mean(tf.minimum(surr1, surr2))) as tf.Scalar;
    const entropy = tf.neg(tf.mean(tf.sum(tf.mul(probs, logProbsAll), 1))) as tf.Scalar;
    return { actorLoss, entropy, ratio: ratio as tf.Tensor1D };
  }

  private continuousSurrogate(
    mean: tf.Tensor2D,
    preTanhTensor: tf.Tensor2D,
    oldLogProbsTensor: tf.Tensor1D,
    advantagesTensor: tf.Tensor1D,
  ): { actorLoss: tf.Scalar; entropy: tf.Scalar; ratio: tf.Tensor1D } {
    if (!this.logStd) {
      throw new Error('[PPOAgent] continuous policy is missing log-std');
    }
    const logStd = this.logStd;
    const std = tf.exp(logStd);
    const z = tf.div(tf.sub(preTanhTensor, mean), std);
    const gauss =
      tf.neg(
        tf.sum(
          tf.add(
            tf.mul(tf.scalar(0.5), tf.square(z)),
            tf.add(logStd, tf.scalar(0.5 * Math.log(2 * Math.PI))),
          ),
          1,
        ),
      ) as tf.Tensor1D;
    const tanh = tf.tanh(preTanhTensor);
    const correction = tf.sum(tf.log(tf.add(tf.sub(1, tf.square(tanh)), 1e-6)), 1);
    const newLogProbs = tf.sub(gauss, correction);
    const ratio = tf.exp(tf.sub(newLogProbs, oldLogProbsTensor));
    const surr1 = tf.mul(ratio, advantagesTensor);
    const surr2 = tf.mul(
      tf.clipByValue(ratio, 1 - this.clipRatio, 1 + this.clipRatio),
      advantagesTensor,
    );
    const actorLoss = tf.neg(tf.mean(tf.minimum(surr1, surr2))) as tf.Scalar;
    const entropy = tf.sum(tf.add(logStd, tf.scalar(0.5 * Math.log(2 * Math.PI * Math.E)))) as tf.Scalar;
    return { actorLoss, entropy, ratio: ratio as tf.Tensor1D };
  }

  private readUpdateStats(
    statesTensor: tf.Tensor2D,
    actions: Array<number | number[]>,
    oldLogProbsTensor: tf.Tensor1D,
    advantagesTensor: tf.Tensor1D,
    returnsTensor: tf.Tensor1D,
    preTanh: Array<number[] | undefined>,
  ): PPOUpdateStats {
    return tf.tidy(() => {
      let actorLoss: tf.Scalar;
      let entropy: tf.Scalar;
      let ratio: tf.Tensor1D;
      switch (this.actionSpace) {
        case 'discrete': {
          const actionsTensor = tf.tensor1d(actions as number[], 'int32');
          const logits = this.actorNet.predict(statesTensor) as tf.Tensor2D;
          const discrete = this.discreteSurrogate(
            logits,
            actionsTensor,
            oldLogProbsTensor,
            advantagesTensor,
          );
          actorLoss = discrete.actorLoss;
          entropy = discrete.entropy;
          ratio = discrete.ratio;
          break;
        }
        case 'continuous': {
          const mean = this.actorNet.predict(statesTensor) as tf.Tensor2D;
          const preTanhTensor = tf.tensor2d(
            preTanh.map((value) => {
              if (!value) throw new Error('[PPOAgent] missing pre-tanh action in continuous rollout');
              return value;
            }),
          );
          const continuous = this.continuousSurrogate(
            mean,
            preTanhTensor,
            oldLogProbsTensor,
            advantagesTensor,
          );
          actorLoss = continuous.actorLoss;
          entropy = continuous.entropy;
          ratio = continuous.ratio;
          break;
        }
        default: {
          const _exhaustive: never = this.actionSpace;
          throw new Error(`[PPOAgent] unsupported action space: ${String(_exhaustive)}`);
        }
      }
      const values = this.criticNet.predict(statesTensor) as tf.Tensor2D;
      const criticLoss = tf.losses.meanSquaredError(returnsTensor, values.squeeze([1]));
      const clipFraction = tf.mean(
        tf.cast(tf.greater(tf.abs(tf.sub(ratio, 1)), this.clipRatio), 'float32'),
      );
      return {
        actorLoss: actorLoss.dataSync()[0],
        criticLoss: (criticLoss as tf.Scalar).dataSync()[0],
        entropy: entropy.dataSync()[0],
        meanRatio: ratio.mean().dataSync()[0],
        clipFraction: (clipFraction as tf.Scalar).dataSync()[0],
      };
    });
  }

  getState(): Record<string, unknown> {
    return {
      trainStepCounter: this.trainStepCounter,
      bestReward: this.bestReward,
      actionSpace: this.actionSpace,
    };
  }

  setState(state: Record<string, unknown>): void {
    if (typeof state.trainStepCounter === 'number') this.trainStepCounter = state.trainStepCounter;
    if (typeof state.bestReward === 'number') this.bestReward = state.bestReward;
  }

  async save(modelId: string, metadata?: Record<string, unknown>): Promise<string> {
    const provider = this.config.storageProvider;
    if (!provider) {
      throw new Error('[PPO] No storageProvider configured. Pass one in PPOConfig.');
    }
    const actorUri = await provider.save(`${modelId}/actor`, this.actorNet, {
      ...metadata,
      network: 'actor',
      actionSpace: this.actionSpace,
    });
    const criticUri = await provider.save(`${modelId}/critic`, this.criticNet, {
      ...metadata,
      network: 'critic',
    });
    if (this.logStd) {
      await this.saveLogStd(provider, modelId, metadata);
    }
    console.log(`[PPO] Saved actor: ${actorUri}, critic: ${criticUri}`);
    return actorUri;
  }

  async load(modelId: string): Promise<void> {
    const provider = this.config.storageProvider;
    if (!provider) {
      throw new Error('[PPO] No storageProvider configured. Pass one in PPOConfig.');
    }
    const actor = await provider.load(`${modelId}/actor`);
    const critic = await provider.load(`${modelId}/critic`);
    this.actorNet.dispose();
    this.criticNet.dispose();
    this.rollout = [];
    this.actorNet = actor;
    this.criticNet = critic;
    if (this.actionSpace === 'continuous') {
      await this.loadLogStd(provider, modelId);
    }
    console.log(`[PPO] Loaded model ${modelId}`);
  }

  dispose(): void {
    this.actorNet?.dispose();
    this.criticNet?.dispose();
    this.logStd?.dispose();
    this.logStd = null;
    this.actorOptimizer.dispose();
    this.criticOptimizer.dispose();
    this.rollout = [];
  }

  private async saveLogStd(
    provider: NonNullable<PPOConfig['storageProvider']>,
    modelId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.logStd) return;
    const wrapper = tf.sequential();
    wrapper.add(
      tf.layers.dense({
        inputShape: [1],
        units: this.actionSize,
        kernelInitializer: 'zeros',
        biasInitializer: 'zeros',
      }),
    );
    const kernel = tf.zeros([1, this.actionSize]);
    const bias = this.logStd.clone();
    wrapper.setWeights([kernel, bias]);
    try {
      await provider.save(`${modelId}/logstd`, wrapper, { ...metadata, network: 'logstd' });
    } finally {
      kernel.dispose();
      bias.dispose();
      wrapper.dispose();
    }
  }

  private async loadLogStd(
    provider: NonNullable<PPOConfig['storageProvider']>,
    modelId: string,
  ): Promise<void> {
    const wrapper = await provider.load(`${modelId}/logstd`);
    try {
      const weights = wrapper.getWeights();
      if (!this.logStd) {
        this.logStd = tf.variable(weights[1].clone(), true, 'ppo_log_std');
      } else {
        this.logStd.assign(weights[1]);
      }
    } finally {
      wrapper.dispose();
    }
  }
}
