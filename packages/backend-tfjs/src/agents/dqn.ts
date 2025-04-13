import * as tf from '@tensorflow/tfjs';
import { ReplayBuffer, Experience } from '../memory/ReplayBuffer';
import { DQNConfig } from '../types';
import { buildQNetwork } from '../model/BuildMLP';

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
  private trainStepCounter: number = 0;
  private actionSize: number;

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

    console.log('[DQN] Building neural networks...');
    this.model = buildQNetwork(inputSize, actionSize, hiddenLayers, lr);
    this.targetModel = buildQNetwork(inputSize, actionSize, hiddenLayers, lr);
    this.updateTargetModel(); // initialise target model
    console.log('[DQN] Neural networks created');

    this.memory = new ReplayBuffer(memorySize);
    console.log('[DQN] Agent initialized with epsilon:', this.epsilon);
  }

  /**
   * Choose an action using an epsilon-greedy strategy.
   */
  async getAction(state: number[]): Promise<number> {
    if (Math.random() < this.epsilon) {
      // Exploration: return a random action
      const randomAction = Math.floor(Math.random() * this.actionSize);
      console.log(`[DQN] Exploring with random action: ${randomAction} (epsilon: ${this.epsilon.toFixed(3)})`);
      return randomAction;
    } else {
      // Exploitation: return the action with highest Q-value
      const stateTensor = tf.tensor2d([state]);
      const qValues = this.model.predict(stateTensor) as tf.Tensor;
      const qValuesData = await qValues.data();
      const action = (await qValues.argMax(1).data())[0];
      console.log(`[DQN] Exploiting with Q-values:`, Array.from(qValuesData), `-> action: ${action}`);
      tf.dispose([stateTensor, qValues]);
      return action;
    }
  }

  /**
   * Store an experience in the replay buffer.
   */
  remember(exp: Experience): void {
    this.memory.add(exp);
  }

  /**
   * Update the target model by copying weights from the main model.
   */
  async updateTargetModel(): Promise<void> {
    console.log('[DQN] Updating target model');
    const weights = this.model.getWeights();
    this.targetModel.setWeights(weights);
  }

  /**
   * Train the agent by sampling a batch from replay memory.
   */
  async train(): Promise<void> {
    if (this.memory.size() < this.batchSize) {
      console.log(`[DQN] Skipping training: not enough experiences (${this.memory.size()}/${this.batchSize})`);
      return;
    }

    console.log(`[DQN] Training on batch of ${this.batchSize}`);
    const batch = this.memory.sample(this.batchSize);

    // Prepare batches for states and next states
    const states = batch.map(exp => exp.state);
    const nextStates = batch.map(exp => exp.nextState);

    const stateTensor = tf.tensor2d(states);
    const nextStateTensor = tf.tensor2d(nextStates);

    // Current Q-values for states using main model
    const qValues = this.model.predict(stateTensor) as tf.Tensor2D;
    // Q-values for next states using target model
    const nextQValues = this.targetModel.predict(nextStateTensor) as tf.Tensor2D;

    const qValuesArray = await qValues.array();
    const nextQValuesArray = await nextQValues.array();

    // Prepare target Q-values
    const targetQ = qValuesArray.map((q, i) => {
      const exp = batch[i];
      const oldQ = q[exp.action];
      if (exp.done) {
        q[exp.action] = exp.reward;
      } else {
        q[exp.action] = exp.reward + this.gamma * Math.max(...nextQValuesArray[i]);
      }
      const newQ = q[exp.action];
      console.log(`[DQN] Experience ${i}: Q-value update`, oldQ, "->", newQ);
      return q;
    });

    const targetTensor = tf.tensor2d(targetQ);
    // Train the model on the batch data
    const result = await this.model.fit(stateTensor, targetTensor, {
      epochs: 1,
      verbose: 0,
    });
    console.log(`[DQN] Training loss: ${result.history.loss[0]}`);

    tf.dispose([stateTensor, nextStateTensor, qValues, nextQValues, targetTensor]);

    // Decay epsilon
    const oldEpsilon = this.epsilon;
    if (this.epsilon > this.minEpsilon) {
      this.epsilon *= this.epsilonDecay;
      console.log(`[DQN] Epsilon decay: ${oldEpsilon.toFixed(3)} -> ${this.epsilon.toFixed(3)}`);
    }

    this.trainStepCounter++;
    if (this.trainStepCounter % this.targetUpdateFrequency === 0) {
      await this.updateTargetModel();
      console.log(`[DQN] Target model updated (step ${this.trainStepCounter})`);
    }
  }

  /**
   * Reset the agent parameters, mainly epsilon.
   */
  reset(): void {
    console.log('[DQN] Resetting agent');
    this.epsilon = this.config.epsilon ?? 1.0;
    this.memory = new ReplayBuffer(this.config.memorySize);
    this.trainStepCounter = 0;
  }
}
