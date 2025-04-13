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
    // Cleanup pour s'assurer qu'on n'accumule pas de tenseurs
    const tensorsStart = tf.memory().numTensors;
    
    if (Math.random() < this.epsilon) {
      // Exploration: return a random action
      const randomAction = Math.floor(Math.random() * this.actionSize);
      console.log(`[DQN] Exploring with random action: ${randomAction} (epsilon: ${this.epsilon.toFixed(3)})`);
      return randomAction;
    } else {
      // Exploitation: return the action with highest Q-value
      // Créer un tenseur pour l'état
      const stateTensor = tf.tensor2d([state]);
      
      // Prédire les Q-values
      const qValues = this.model.predict(stateTensor) as tf.Tensor;
      
      // Obtenir les données de manière synchrone
      const qValuesData = qValues.dataSync();
      console.log(`[DQN] Q-values:`, Array.from(qValuesData));
      
      // Trouver l'action avec la plus grande Q-value
      let maxIndex = 0;
      for (let i = 1; i < qValuesData.length; i++) {
        if (qValuesData[i] > qValuesData[maxIndex]) {
          maxIndex = i;
        }
      }
      
      // Libérer les ressources
      tf.dispose([stateTensor, qValues]);
      
      console.log(`[DQN] Tensors after getAction: before=${tensorsStart}, after=${tf.memory().numTensors}`);
      return maxIndex;
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

    // Surveiller les tenseurs avant l'entraînement
    const tensorsBefore = tf.memory().numTensors;
    console.log(`[DQN] Training on batch of ${this.batchSize}, tensors before:`, tensorsBefore);
    
    try {
      // Get a batch of experiences
      const batch = this.memory.sample(this.batchSize);

      // Prepare tensors for current and next states
      const states = batch.map(exp => exp.state);
      const nextStates = batch.map(exp => exp.nextState);

      const stateTensor = tf.tensor2d(states);
      const nextStateTensor = tf.tensor2d(nextStates);

      // Calculate Q-values for current state
      const qValues = this.model.predict(stateTensor) as tf.Tensor2D;
      // Calculate Q-values for next state
      const nextQValues = this.targetModel.predict(nextStateTensor) as tf.Tensor2D;

      // Convertir tensors in javascript array
      const qValuesArray = qValues.arraySync() as number[][];
      const nextQValuesArray = nextQValues.arraySync() as number[][];
      tf.dispose([qValues,nextQValues])

      // Prepare target values for training
      const targetQ = qValuesArray.map((q, i) => {
        const exp = batch[i];
        const oldQ = q[exp.action];
        if (exp.done) {
          q[exp.action] = exp.reward;
        } else {
          q[exp.action] = exp.reward + this.gamma * Math.max(...nextQValuesArray[i]);
        }
        const newQ = q[exp.action];
        console.log(`[DQN] Exp ${i}: Q-value ${oldQ.toFixed(4)} -> ${newQ.toFixed(4)}`);
        return q;
      });

      const targetTensor = tf.tensor2d(targetQ);

      // Train the model
      const result = await this.model.fit(stateTensor, targetTensor, {
        epochs: 1,
        verbose: 0,
      });

      // Display the loss
      const loss = result.history.loss[0] as number;
      console.log(`[DQN] Training loss: ${loss.toFixed(4)}`);

      // Dispose of created tensors
      tf.dispose([stateTensor, nextStateTensor, qValues, nextQValues, targetTensor]);

      // Update epsilon (exploration/exploitation)
      const oldEpsilon = this.epsilon;
      if (this.epsilon > this.minEpsilon) {
        this.epsilon *= this.epsilonDecay;
        console.log(`[DQN] Epsilon: ${oldEpsilon.toFixed(3)} -> ${this.epsilon.toFixed(3)}`);
      }

      // Update target model periodically
      this.trainStepCounter++;
      if (this.trainStepCounter % this.targetUpdateFrequency === 0) {
        await this.updateTargetModel();
        console.log(`[DQN] Target model updated at step ${this.trainStepCounter}`);
      }
    } catch (error) {
      console.error('[DQN] Error during training:', error);
    } finally {
      // Check for potential leaks
      const tensorsAfter = tf.memory().numTensors;
      console.log(`[DQN] Tensors after training: ${tensorsBefore} -> ${tensorsAfter} (diff: ${tensorsAfter - tensorsBefore})`);
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
  
  /**
   * Dispose of tensors and models to prevent memory leaks
   */
  dispose(): void {
    console.log('[DQN] Disposing agent resources');
    if (this.model) {
      this.model.dispose();
    }
    if (this.targetModel) {
      this.targetModel.dispose();
    }
    // Clear the memory
    this.memory = new ReplayBuffer(0);
  }
}
