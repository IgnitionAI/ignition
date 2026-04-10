import type { TFBackend } from './utils/backend-selector';

// Re-export core types for convenience
export type { AgentInterface, Experience } from '@ignitionai/core';

export interface DQNConfig {
  backend?: TFBackend;             // TF.js backend to use (default: 'auto')
  inputSize: number;              // Dimension du vecteur d'état
  actionSize: number;             // Nombre d'actions discrètes
  hiddenLayers?: number[];        // Neurones par couche cachée (défaut : [24, 24])
  gamma?: number;                 // Facteur de discount (défaut : 0.99)
  epsilon?: number;               // Taux d'exploration initial (défaut : 1.0)
  epsilonDecay?: number;          // Décroissance d'epsilon par step (défaut : 0.995)
  minEpsilon?: number;            // Epsilon minimum (défaut : 0.01)
  lr?: number;                    // Taux d'apprentissage (défaut : 0.001)
  batchSize?: number;             // Taille du batch (défaut : 32)
  memorySize?: number;            // Taille du replay buffer (défaut : 10000)
  targetUpdateFrequency?: number; // Fréquence de synchro du target network (en steps)
}

export interface PPOConfig {
  backend?: TFBackend;             // TF.js backend to use (default: 'auto')
  inputSize: number;        // Dimension du vecteur d'état
  actionSize: number;       // Nombre d'actions discrètes
  hiddenLayers?: number[];  // Neurones par couche cachée (défaut : [64, 64])
  lr?: number;              // Taux d'apprentissage (défaut : 3e-4)
  gamma?: number;           // Facteur de discount (défaut : 0.99)
  gaeLambda?: number;       // Paramètre λ du GAE (défaut : 0.95)
  clipRatio?: number;       // Epsilon du clipping PPO (défaut : 0.2)
  epochs?: number;          // Epochs d'optimisation par mise à jour (défaut : 4)
  batchSize?: number;       // Taille des mini-batchs (défaut : 64)
  entropyCoef?: number;     // Coefficient du bonus d'entropie (défaut : 0.01)
  valueLossCoef?: number;   // Coefficient de la loss du critic (défaut : 0.5)
}

export interface QTableConfig {
  backend?: TFBackend;             // TF.js backend to use (default: 'auto')
  inputSize: number;        // Nombre de dimensions d'état
  actionSize: number;       // Nombre d'actions discrètes
  stateBins?: number;       // Nombre de bins par dimension (défaut : 10)
  stateLow?: number[];      // Borne inférieure par dimension (défaut : 0)
  stateHigh?: number[];     // Borne supérieure par dimension (défaut : 1)
  lr?: number;              // Taux d'apprentissage (défaut : 0.1)
  gamma?: number;           // Facteur de discount (défaut : 0.99)
  epsilon?: number;         // Taux d'exploration initial (défaut : 1.0)
  epsilonDecay?: number;    // Décroissance d'epsilon par step (défaut : 0.995)
  minEpsilon?: number;      // Epsilon minimum (défaut : 0.01)
}
