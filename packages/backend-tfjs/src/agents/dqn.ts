import * as tf from '@tensorflow/tfjs';
import { AgentInterface, Experience } from '@ignitionai/core';

import { loadModelFromHub } from '../io/loadModel';
import { saveModelToHub } from '../io/saveModelToHub';
import { ReplayBuffer } from '../memory/ReplayBuffer';
import { buildQNetwork } from '../model/BuildMLP';
import { DQNConfig } from '../types';
import { DQNConfigSchema } from '../schemas';
import { setBackend } from '../utils/backend-selector';

export class DQNAgent implements AgentInterface {
  private model: tf.Sequential;
  private targetModel: tf.Sequential;
  private memory: ReplayBuffer;
  private epsilon: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private gamma: number;
  private batchSize: number;
  private targetUpdateFrequency: number;
  private trainStepCounter = 0;
  private actionSize: number;
  private bestReward = -Infinity;

  constructor(private config: DQNConfig) {
    const result = DQNConfigSchema.safeParse(config);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      throw new Error(`[DQNAgent] Invalid config: ${messages}`);
    }
    const {
      inputSize,
      actionSize,
      hiddenLayers = [24, 24],
      gamma = 0.99,
      epsilon = 1.0,
      epsilonDecay = 0.995,
      minEpsilon = 0.01,
      lr = 0.001,
      batchSize = 32,
      memorySize = 10000,
      targetUpdateFrequency = 1000,
      backend = 'auto',
    } = config;

    setBackend(backend).catch(err =>
      console.warn('[DQNAgent] Backend init warning:', err)
    );

    this.actionSize = actionSize;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.epsilonDecay = epsilonDecay;
    this.minEpsilon = minEpsilon;
    this.batchSize = batchSize;
    this.targetUpdateFrequency = targetUpdateFrequency;

    this.model = buildQNetwork(inputSize, actionSize, hiddenLayers, lr);
    this.targetModel = buildQNetwork(inputSize, actionSize, hiddenLayers, lr);
    this.updateTargetModel();

    this.memory = new ReplayBuffer(memorySize);
  }

  async getAction(state: number[], greedy?: boolean): Promise<number> {
    if (!greedy && Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }

    const stateTensor = tf.tensor2d([state]);
    const qValues = this.model.predict(stateTensor) as tf.Tensor;
    // argMax crée un tensor intermédiaire : on le dispose explicitement
    const argMaxTensor = qValues.argMax(1);
    const action = (await argMaxTensor.data())[0];

    tf.dispose([stateTensor, qValues, argMaxTensor]);
    return action;
  }

  remember(exp: Experience): void {
    this.memory.add(exp);
  }

  async updateTargetModel(): Promise<void> {
    this.targetModel.setWeights(this.model.getWeights());
  }

  async train(): Promise<void> {
    if (this.memory.size() < this.batchSize) return;

    const batch = this.memory.sample(this.batchSize);
    const states = batch.map(e => e.state);
    const nextStates = batch.map(e => e.nextState);

    const stateTensor = tf.tensor2d(states);
    const nextStateTensor = tf.tensor2d(nextStates);

    const qValues = this.model.predict(stateTensor) as tf.Tensor2D;
    const nextQValues = this.targetModel.predict(nextStateTensor) as tf.Tensor2D;

    const qArray = qValues.arraySync() as number[][];
    const nextQArray = nextQValues.arraySync() as number[][];

    const updatedQ = qArray.map((q, i) => {
      const { action, reward, terminated, truncated } = batch[i];
      const done = terminated || truncated;
      const a = action as number;
      q[a] = done ? reward : reward + this.gamma * Math.max(...nextQArray[i]);
      return q;
    });

    const targetTensor = tf.tensor2d(updatedQ);
    await this.model.fit(stateTensor, targetTensor, { epochs: 1, verbose: 0 });

    tf.dispose([stateTensor, nextStateTensor, qValues, nextQValues, targetTensor]);

    if (this.epsilon > this.minEpsilon) {
      this.epsilon *= this.epsilonDecay;
    }

    this.trainStepCounter++;
    if (this.trainStepCounter % this.targetUpdateFrequency === 0) {
      await this.updateTargetModel();
    }
  }

  reset(): void {
    this.epsilon = this.config.epsilon ?? 1.0;
    this.memory = new ReplayBuffer(this.config.memorySize);
    this.trainStepCounter = 0;
  }

  async saveToHub(repoId: string, token: string, modelName = 'model', checkpointName = 'last'): Promise<void> {
    console.log(`[DQN] Saving model to HF Hub: ${repoId}`);
    await saveModelToHub(this.model, repoId, token, `${modelName}_${checkpointName}`);
  }

  async loadFromHub(repoId: string, modelPath = 'model.json'): Promise<void> {
    console.log(`[DQN] Loading model from HF Hub: ${repoId}`);
    const loadedModel = await loadModelFromHub(repoId, modelPath);
    this.model = loadedModel as tf.Sequential;
    await this.updateTargetModel();
  }

  async saveCheckpoint(repoId: string, token: string, checkpointName: string): Promise<void> {
    const folder = `model_${checkpointName}`;
    console.log(`[DQN] Saving checkpoint "${checkpointName}" to HF Hub...`);
    await saveModelToHub(this.model, repoId, token, folder);
    console.log(`[DQN] ✅ Checkpoint "${checkpointName}" saved`);
  }

  async maybeSaveBestCheckpoint(repoId: string, token: string, reward: number, step?: number): Promise<void> {
    console.log(`[DQN] Current best: ${this.bestReward.toFixed(4)}, new reward: ${reward.toFixed(4)}`);
    if (reward > this.bestReward) {
      console.log(`[DQN] 🏆 New best reward: ${reward.toFixed(3)} > ${this.bestReward.toFixed(3)}`);
      this.bestReward = reward;
      const checkpointName = step !== undefined ? `step-${step}` : 'best';
      await this.saveCheckpoint(repoId, token, checkpointName);
    }
  }

  async loadCheckpoint(repoId: string, checkpointName: string): Promise<void> {
    const modelPath = `model_${checkpointName}/model.json`;
    console.log(`[DQN] Loading checkpoint "${checkpointName}" from HF Hub...`);
    const model = await loadModelFromHub(repoId, modelPath);
    this.model = model as tf.Sequential;
    await this.updateTargetModel();
    console.log(`[DQN] ✅ Checkpoint "${checkpointName}" loaded`);
  }

  // ── ModelStorageProvider-based save / load ────────────────────────────

  /**
   * Save the model via the configured storageProvider.
   * Throws if no storageProvider was supplied in DQNConfig.
   *
   * @returns the URI returned by the provider (e.g. "hf://user/repo/modelId")
   */
  async saveModel(
    modelId: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const provider = this.config.storageProvider;
    if (!provider) {
      throw new Error('[DQN] No storageProvider configured. Pass one in DQNConfig.');
    }
    return provider.save(modelId, this.model, metadata);
  }

  /**
   * Load a model via the configured storageProvider and replace the current model.
   * Throws if no storageProvider was supplied in DQNConfig.
   */
  async loadModel(modelId: string): Promise<void> {
    const provider = this.config.storageProvider;
    if (!provider) {
      throw new Error('[DQN] No storageProvider configured. Pass one in DQNConfig.');
    }
    const loaded = await provider.load(modelId);
    this.model = loaded as tf.Sequential;
    await this.updateTargetModel();
  }

  dispose(): void {
    console.log(`[DQN] Disposing model...`);
    this.model?.dispose();
    this.targetModel?.dispose();
    this.memory = new ReplayBuffer(0);
    console.log(`[DQN] ✅ DQNAgent disposed`);
  }
}
