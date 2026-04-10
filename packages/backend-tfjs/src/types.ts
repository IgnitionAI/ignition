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
    inputSize: number;            // Dimension of the state vector
    actionSize: number;           // Number of possible discrete actions
    hiddenLayers?: number[];      // Neurons per hidden layer, default: [64, 64]
    gamma?: number;               // Discount factor (default: 0.99)
    lr?: number;                  // Learning rate (default: 3e-4)
    clipRatio?: number;           // PPO clip ratio (default: 0.2)
    epochs?: number;              // Number of optimization epochs per update (default: 4)
    entropyCoeff?: number;        // Entropy bonus coefficient (default: 0.01)
    valueCoeff?: number;          // Value loss coefficient (default: 0.5)
    valueLossCoeff?: number;      // Alias for valueCoeff
    gaeLambda?: number;           // GAE lambda for advantage estimation (default: 0.95)
    maxTrajectoryLength?: number; // Max steps per trajectory before training (default: 128)
    nSteps?: number;              // Alias for maxTrajectoryLength
    batchSize?: number;           // Mini-batch size per epoch (default: 64)
}
