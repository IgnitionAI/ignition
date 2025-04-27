import { create } from 'zustand'

interface TrainingState {
  incrementElapsedTime: (delta: number) => void;
  episodeCount: number;
  successCount: number;
  rewards: number[];
  collected: boolean;
  isTraining: boolean;
  elapsedTime: number;
  progressToTarget: number;
  setCollected: (value: boolean) => void;
  addReward: (reward: number) => void;
  incrementEpisode: () => void;
  incrementSuccess: () => void;
  setTraining: (isTraining: boolean) => void;
  setElapsedTime: (time: number) => void;
  setProgressToTarget: (progress: number) => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  episodeCount: 0,
  successCount: 0,
  rewards: [],
  collected: false,
  isTraining: false,
  elapsedTime: 0,
  progressToTarget: 0,
  incrementElapsedTime: (delta: number) => set((state) => ({ elapsedTime: state.elapsedTime + delta })),
  setCollected: (value) => set(() => ({ collected: value })),
  addReward: (reward) => set((state) => ({ rewards: [...state.rewards.slice(-30), reward] })),
  incrementEpisode: () => set((state) => ({ episodeCount: state.episodeCount + 1 })),
  incrementSuccess: () => set((state) => ({ successCount: state.successCount + 1 })),
  setTraining: (isTraining: boolean) => set({ isTraining }),
  setElapsedTime: (time: number) => set({ elapsedTime: time }),
  setProgressToTarget: (progress: number) => set({ progressToTarget: progress })
}))
