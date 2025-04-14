import * as tf from '@tensorflow/tfjs';
import { ReplayBuffer, Experience } from '../memory/ReplayBuffer';
import { DQNConfig } from '../types';
import { buildQNetwork } from '../model/BuildMLP';
import { saveModelToHub } from '../io/saveModelToHub';
import { loadModelFromHub } from '../io/loadModel';
export class DQNAgent {
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
  private bestReward: number = -Infinity;

  constructor(private config: DQNConfig) {
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
    } = config;

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

  async getAction(state: number[]): Promise<number> {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }

    const stateTensor = tf.tensor2d([state]);
    const qValues = this.model.predict(stateTensor) as tf.Tensor;
    const action = (await qValues.argMax(1).data())[0];

    tf.dispose([stateTensor, qValues]);
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
      const { action, reward, done } = batch[i];
      q[action] = done ? reward : reward + this.gamma * Math.max(...nextQArray[i]);
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
    await saveModelToHub(this.model, repoId, token, `model_${checkpointName}`);

  }

  async loadFromHub(repoId: string, modelPath = 'model.json'): Promise<void> {
    console.log(`[DQN] Loading model from HF Hub: ${repoId}`);
    const loadedModel = await loadModelFromHub(repoId, modelPath);
    this.model = loadedModel as tf.Sequential;
    await this.updateTargetModel();
  }

  /**
 * Save the model under a checkpoint name to Hugging Face Hub.
 * e.g., checkpointName = "last", "best", "step-1000"
 */
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


/**
 * Load a checkpointed model from Hugging Face Hub.
 */
async loadCheckpoint(repoId: string, checkpointName: string): Promise<void> {
  const modelPath = `model_${checkpointName}/model.json`;
  console.log(`[DQN] Loading checkpoint "${checkpointName}" from HF Hub...`);
  const model = await loadModelFromHub(repoId, modelPath);
  this.model = model as tf.Sequential;
  await this.updateTargetModel();
  console.log(`[DQN] ✅ Checkpoint "${checkpointName}" loaded`);
}


  dispose(): void {
    console.log(`[DQN] Disposing model...`);
    this.model?.dispose();
    console.log(`[DQN] Model disposed`);
    this.targetModel?.dispose();
    console.log(`[DQN] Target model disposed`);
    this.memory = new ReplayBuffer(0);
    console.log(`[DQN] Memory disposed`);
    console.log(`[DQN] ✅ DQNAgent disposed`);
  }
}
