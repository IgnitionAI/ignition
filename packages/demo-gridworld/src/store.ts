import { create } from 'zustand';
import type { AlgorithmType } from '@ignitionai/core';

interface GridState {
  agentRow: number;
  agentCol: number;
  targetRow: number;
  targetCol: number;
  trail: [number, number][];
  gridSize: number;
}

interface DemoStore {
  grid: GridState;
  rewardHistory: number[];
  isTraining: boolean;
  episodeCount: number;
  stepCount: number;
  algorithm: AlgorithmType;

  updateGrid: (grid: GridState) => void;
  recordEpisode: (totalReward: number) => void;
  setTraining: (v: boolean) => void;
  setAlgorithm: (algo: AlgorithmType) => void;
  incrementStep: () => void;
  resetStats: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  grid: { agentRow: 0, agentCol: 0, targetRow: 6, targetCol: 6, trail: [], gridSize: 7 },
  rewardHistory: [],
  isTraining: false,
  episodeCount: 0,
  stepCount: 0,
  algorithm: 'dqn',

  updateGrid: (grid) => set({ grid }),
  recordEpisode: (totalReward) =>
    set((s) => ({
      rewardHistory: [...s.rewardHistory, totalReward],
      episodeCount: s.episodeCount + 1,
    })),
  setTraining: (isTraining) => set({ isTraining }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  incrementStep: () => set((s) => ({ stepCount: s.stepCount + 1 })),
  resetStats: () => set({ rewardHistory: [], episodeCount: 0, stepCount: 0 }),
}));
