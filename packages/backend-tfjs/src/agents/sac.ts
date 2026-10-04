import * as tf from '@tensorflow/tfjs';
import {
  validateContinuousAction, validateContinuousVector,
  type ContinuousAgent, type ContinuousExperience, type ContinuousActionBounds,
} from '@ignitionai/core';
import { sacCheckpointSchema } from '../sac/checkpoint';
import { ReplayBuffer } from '../memory/ReplayBuffer';
import { SACNetwork, type NetworkWeights } from '../sac/network';
import { resolveSACConfig, type SACConfig, type SACSettings } from '../sac/config';

export interface SACSnapshot {
  algorithm: 'sac';
  version: 'sac-v1';
  settings: SACSettings;
  low: number[];
  high: number[];
  samples: number;
  updates: number;
  randomState: number;
  networks: NetworkWeights[][];
}

/** Fixed-temperature SAC with reparameterized bounded actions and twin critics. */
export class SACAgent implements ContinuousAgent {
  readonly settings: SACSettings;
  readonly bounds: ContinuousActionBounds;
  private readonly actor: SACNetwork;
  private readonly critics: SACNetwork[];
  private readonly targets: SACNetwork[];
  private actorOptimizer: tf.Optimizer;
  private criticOptimizer: tf.Optimizer;
  private memory: ReplayBuffer;
  private randomState: number;
  private samples = 0;
  private updates = 0;
  private disposed = false;
  private criticLoss: number | null = null;
  private actorLoss: number | null = null;

  constructor(config: SACConfig) {
    const { settings, bounds } = resolveSACConfig(config);
    this.settings = settings; this.bounds = bounds; this.randomState = settings.seed;
    this.memory = new ReplayBuffer(settings.memorySize, () => this.random());
    this.actor = new SACNetwork([settings.inputSize, ...settings.hiddenLayers, bounds.size * 2], settings.seed);
    const sizes = [settings.inputSize + bounds.size, ...settings.hiddenLayers, 1];
    this.critics = [new SACNetwork(sizes, settings.seed + 100), new SACNetwork(sizes, settings.seed + 200)];
    this.targets = [new SACNetwork(sizes, settings.seed + 300), new SACNetwork(sizes, settings.seed + 400)];
    this.targets.forEach((target, i) => target.copyFrom(this.critics[i]));
    this.actorOptimizer = tf.train.adam(settings.lr);
    this.criticOptimizer = tf.train.adam(settings.lr);
  }

  private random(): number {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }

  private gaussianNoise(rows: number): tf.Tensor2D {
    const values = Array.from({ length: rows * this.bounds.size }, () =>
      Math.sqrt(-2 * Math.log(Math.max(this.random(), 1e-12))) * Math.cos(2 * Math.PI * this.random()));
    return tf.tensor2d(values, [rows, this.bounds.size]);
  }

  private policy(states: tf.Tensor2D, greedy = false): { actions: tf.Tensor2D; logDensity: tf.Tensor1D } {
    const parameters = this.actor.forward(states), size = this.bounds.size;
    const mean = parameters.slice([0, 0], [-1, size]);
    const logStd = parameters.slice([0, size], [-1, size]).clipByValue(-20, 2);
    const noise = greedy ? tf.zerosLike(mean) : this.gaussianNoise(states.shape[0]);
    const raw = mean.add(logStd.exp().mul(noise));
    const scale = tf.tensor1d(this.bounds.high.map((high, i) => (high - this.bounds.low[i]) / 2));
    const center = tf.tensor1d(this.bounds.low.map((low, i) => low + (this.bounds.high[i] - low) / 2));
    const actions = raw.tanh().mul(scale).add(center) as tf.Tensor2D;
    const gaussian = noise.square().add(logStd.mul(2)).add(Math.log(2 * Math.PI)).mul(-0.5);
    const jacobian = tf.scalar(Math.log(2)).sub(raw).sub(tf.softplus(raw.mul(-2))).mul(2);
    const logDensity = gaussian.sub(jacobian).sub(scale.log()).sum(1) as tf.Tensor1D;
    return { actions, logDensity };
  }

  async getAction(observation: number[], greedy = false): Promise<number[]> {
    this.assertActive();
    const state = validateContinuousVector(observation, this.settings.inputSize, 'Observation');
    if (!greedy && this.samples < this.settings.warmup) {
      return this.bounds.low.map((low, i) => low + this.random() * (this.bounds.high[i] - low));
    }
    const values = tf.tidy(() => Array.from(this.policy(tf.tensor2d([state]), greedy).actions.dataSync()));
    return validateContinuousAction(values.map((value, i) =>
      Math.max(this.bounds.low[i], Math.min(this.bounds.high[i], value))), this.bounds);
  }

  remember(experience: ContinuousExperience): void {
    this.assertActive();
    const state = validateContinuousVector(experience.state, this.settings.inputSize, 'State');
    const nextState = validateContinuousVector(experience.nextState, this.settings.inputSize, 'Next state');
    const action = validateContinuousAction(experience.action, this.bounds);
    if (!Number.isFinite(experience.reward) || typeof experience.terminated !== 'boolean'
      || typeof experience.truncated !== 'boolean') throw new Error('[SAC] Invalid transition');
    this.memory.add({ ...experience, state, nextState, action });
    this.samples++;
  }

  private q(network: SACNetwork, states: tf.Tensor2D, actions: tf.Tensor2D): tf.Tensor1D {
    return network.forward(tf.concat([states, actions], 1)).reshape([-1]) as tf.Tensor1D;
  }

  private optimize(optimizer: tf.Optimizer, variables: tf.Variable[], loss: () => tf.Scalar): number {
    const result = tf.variableGrads(loss, variables);
    try {
      if (!Number.isFinite(result.value.dataSync()[0])
        || Object.values(result.grads).some(gradient => Array.from(gradient.dataSync()).some(value => !Number.isFinite(value)))) {
        throw new Error('[SAC] Nonfinite loss or gradient');
      }
      optimizer.applyGradients(result.grads);
      return result.value.dataSync()[0];
    } finally { result.value.dispose(); tf.dispose(Object.values(result.grads)); }
  }

  async train(): Promise<void> {
    this.assertActive();
    const c = this.settings;
    if (this.memory.size() < c.batchSize || this.samples < c.warmup || this.samples % c.updateEvery !== 0) return;
    const batch = this.memory.sample(c.batchSize);
    tf.tidy(() => {
      const states = tf.tensor2d(batch.map(item => item.state));
      const nextStates = tf.tensor2d(batch.map(item => item.nextState));
      const actions = tf.tensor2d(batch.map(item => {
        if (!Array.isArray(item.action)) throw new Error('[SAC] Invalid replay action');
        return item.action;
      }));
      const rewards = tf.tensor1d(batch.map(item => item.reward));
      const continuation = tf.tensor1d(batch.map(item => item.terminated ? 0 : 1));
      // Computed outside variableGrads: the Bellman target has no gradient path.
      const next = this.policy(nextStates);
      const targetQ = tf.minimum(this.q(this.targets[0], nextStates, next.actions), this.q(this.targets[1], nextStates, next.actions));
      const target = rewards.add(targetQ.sub(next.logDensity.mul(c.alpha)).mul(continuation).mul(c.gamma));
      this.criticLoss = this.optimize(this.criticOptimizer, this.critics.flatMap(network => network.variables), () =>
        this.q(this.critics[0], states, actions).sub(target).square().mean()
          .add(this.q(this.critics[1], states, actions).sub(target).square().mean()) as tf.Scalar);
      this.actorLoss = this.optimize(this.actorOptimizer, this.actor.variables, () => {
        const policy = this.policy(states);
        const q = tf.minimum(this.q(this.critics[0], states, policy.actions), this.q(this.critics[1], states, policy.actions));
        return policy.logDensity.mul(c.alpha).sub(q).mean() as tf.Scalar;
      });
      this.targets.forEach((targetNetwork, i) => targetNetwork.copyFrom(this.critics[i], c.tau));
    });
    this.updates++;
  }

  /** Read training diagnostics for progress displays without modifying the policy. */
  getState(): { samples: number; updates: number; criticLoss: number | null; actorLoss: number | null } {
    return { samples: this.samples, updates: this.updates, criticLoss: this.criticLoss, actorLoss: this.actorLoss };
  }

  exportCheckpoint(): SACSnapshot {
    this.assertActive();
    return { algorithm: 'sac', version: 'sac-v1', settings: { ...this.settings, hiddenLayers: [...this.settings.hiddenLayers] },
      low: [...this.bounds.low], high: [...this.bounds.high], samples: this.samples, updates: this.updates,
      randomState: this.randomState, networks: [this.actor, ...this.critics, ...this.targets].map(network => network.snapshot()) };
  }

  /** Restore compatible networks/state. Optimizers and replay restart fresh. */
  loadCheckpoint(value: unknown): void {
    this.assertActive();
    const checkpoint = sacCheckpointSchema.parse(value);
    const current = this.exportCheckpoint();
    if (JSON.stringify(checkpoint.settings) !== JSON.stringify(current.settings)
      || JSON.stringify(checkpoint.low) !== JSON.stringify(current.low)
      || JSON.stringify(checkpoint.high) !== JSON.stringify(current.high)) {
      throw new Error('[SAC] Incompatible checkpoint configuration or bounds');
    }
    const networks = [this.actor, ...this.critics, ...this.targets];
    networks.forEach((network, i) => {
      const weights = checkpoint.networks[i];
      if (weights.length !== network.variables.length || weights.some((weight, j) => {
        const shape = network.variables[j].shape;
        return weight.shape.length !== shape.length || weight.shape.some((size, k) => size !== shape[k])
          || weight.values.length !== shape.reduce((total, size) => total * size, 1);
      })) throw new Error('[SAC] Incompatible checkpoint weights');
    });
    tf.tidy(() => {
      // Allocate and validate every tensor before modifying any network.
      const tensors = checkpoint.networks.map(weights => weights.map(weight => tf.tensor(weight.values, weight.shape)));
      networks.forEach((network, i) => network.variables.forEach((variable, j) => variable.assign(tensors[i][j])));
    });
    this.actorOptimizer.dispose(); this.criticOptimizer.dispose();
    this.actorOptimizer = tf.train.adam(this.settings.lr); this.criticOptimizer = tf.train.adam(this.settings.lr);
    this.memory = new ReplayBuffer(this.settings.memorySize, () => this.random());
    this.criticLoss = null; this.actorLoss = null;
    this.samples = checkpoint.samples; this.updates = checkpoint.updates; this.randomState = checkpoint.randomState;
  }

  private assertActive(): void {
    if (this.disposed) throw new Error('[SAC] Agent is disposed');
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    [this.actor, ...this.critics, ...this.targets].forEach(network => network.dispose());
    this.actorOptimizer.dispose(); this.criticOptimizer.dispose();
  }
}
