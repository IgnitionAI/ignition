import { create } from 'zustand';

interface TrainingState {
  // États d'entraînement
  isTraining: boolean;
  isTrainingInProgress: boolean; 
  episodeCount: number;
  reward: number;
  bestReward: number;
  episodeSteps: number;
  reachedTarget: boolean;
  episodeTime: number;
  episodeStartTime: number;
  successCount: number;
  difficulty: number;
  lastAction: number;
  
  // État de la cible
  targetPosition: [number, number, number];
  
  // Actions
  setIsTraining: (value: boolean) => void;
  setIsTrainingInProgress: (value: boolean) => void; 
  setEpisodeCount: (value: number | ((prev: number) => number)) => void;
  setReward: (value: number) => void;
  setBestReward: (value: number) => void;
  setEpisodeSteps: (value: number | ((prev: number) => number)) => void;
  setReachedTarget: (value: boolean) => void;
  setEpisodeTime: (value: number) => void;
  setEpisodeStartTime: (value: number) => void;
  setSuccessCount: (value: number | ((prev: number) => number)) => void;
  setDifficulty: (value: number | ((prev: number) => number)) => void;
  setLastAction: (value: number) => void;
  setTargetPosition: (value: [number, number, number]) => void;
  
  // Méthodes utilitaires
  resetEpisode: () => void;
  incrementEpisodeCount: () => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  // États initiaux
  isTraining: false,
  isTrainingInProgress: false, 
  episodeCount: 0,
  reward: 0,
  bestReward: -Infinity,
  episodeSteps: 0,
  reachedTarget: false,
  episodeTime: 0,
  episodeStartTime: Date.now(),
  successCount: 0,
  difficulty: 0,
  lastAction: -1,
  
  // État initial de la cible
  targetPosition: [0, 10, 0] as [number, number, number],
  
  // Actions
  setIsTraining: (value) => set({ isTraining: value }),
  setIsTrainingInProgress: (value) => set({ isTrainingInProgress: value }), 
  setEpisodeCount: (value) => set((state) => ({ 
    episodeCount: typeof value === 'function' ? value(state.episodeCount) : value 
  })),
  setReward: (value) => set({ reward: value }),
  setBestReward: (value) => set({ bestReward: value }),
  setEpisodeSteps: (value) => set((state) => ({ 
    episodeSteps: typeof value === 'function' ? value(state.episodeSteps) : value 
  })),
  setReachedTarget: (value) => set({ reachedTarget: value }),
  setEpisodeTime: (value) => set({ episodeTime: value }),
  setEpisodeStartTime: (value) => set({ episodeStartTime: value }),
  setSuccessCount: (value) => set((state) => ({ 
    successCount: typeof value === 'function' ? value(state.successCount) : value 
  })),
  setDifficulty: (value) => set((state) => ({ 
    difficulty: typeof value === 'function' ? value(state.difficulty) : value 
  })),
  setLastAction: (value) => set({ lastAction: value }),
  setTargetPosition: (value) => set({ targetPosition: value }),
  
  // Méthodes utilitaires
  resetEpisode: () => set((state) => ({ 
    episodeSteps: 0,
    reachedTarget: false,
    episodeCount: state.episodeCount + 1,
    episodeTime: 0,
    episodeStartTime: Date.now()
  })),
  incrementEpisodeCount: () => set((state) => ({ episodeCount: state.episodeCount + 1 }))
}));
