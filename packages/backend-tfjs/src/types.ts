export interface DQNConfig {
    inputSize: number;            // Dimension of the state vector
    actionSize: number;           // Number of possible discrete actions
    hiddenLayers?: number[];      // Number of neurons per hidden layer, default: [24, 24]
    gamma?: number;               // Discount factor (default: 0.99)
    epsilon?: number;             // Exploration rate (default: 1.0)
    epsilonDecay?: number;        // Decay rate for epsilon per training step (default: 0.995)
    minEpsilon?: number;          // Minimum exploration rate (default: 0.01)
    lr?: number;                  // Learning rate for the optimizer (default: 0.001)
    batchSize?: number;           // Batch size for training (default: 32)
    memorySize?: number;          // Maximum size of the replay buffer (default: 10000)
    targetUpdateFrequency?: number; // How often to update the target network (in training steps)
  }

  export interface PPOConfig {
    inputSize: number;              // Dimension of the state vector
    actionSize: number;             // Number of possible discrete actions
    hiddenLayers?: number[];        // Neurons per hidden layer (default: [64, 64])
    clipRatio?: number;             // PPO clipping epsilon (default: 0.2)
    gaeLambda?: number;             // GAE lambda for advantage estimation (default: 0.95)
    entropyCoeff?: number;          // Entropy bonus coefficient (default: 0.01)
    valueLossCoeff?: number;        // Value loss coefficient (default: 0.5)
    lr?: number;                    // Learning rate (default: 0.0003)
    nSteps?: number;                // Rollout length before training (default: 128)
    batchSize?: number;             // Mini-batch size per epoch (default: 64)
    epochs?: number;                // PPO epochs per rollout (default: 4)
    gamma?: number;                 // Discount factor (default: 0.99)
  }
