import { create } from 'zustand';
import type { AlgorithmType } from '@ignitionai/core';
import type { CartPoleState } from './cartpole-env';

interface DemoStore {
  cartpole: CartPoleState;
  rewardHistory: number[];
  isTraining: boolean;
  episodeCount: number;
  algorithm: AlgorithmType;

  updateState: (s: CartPoleState) => void;
  recordEpisode: (totalReward: number) => void;
  setTraining: (v: boolean) => void;
  setAlgorithm: (a: AlgorithmType) => void;
  resetStats: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  cartpole: { x: 0, xDot: 0, theta: 0, thetaDot: 0, stepCount: 0 },
  rewardHistory: [],
  isTraining: false,
  episodeCount: 0,
  algorithm: 'dqn',

  updateState: (cartpole) => set({ cartpole }),
  recordEpisode: (r) => set((s) => ({ rewardHistory: [...s.rewardHistory, r], episodeCount: s.episodeCount + 1 })),
  setTraining: (isTraining) => set({ isTraining }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  resetStats: () => set({ rewardHistory: [], episodeCount: 0 }),
}));
