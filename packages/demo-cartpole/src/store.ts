import { create } from 'zustand';
import type { AlgorithmType } from '@ignitionai/core';
import type { CartPoleState } from './cartpole-env';

interface DemoStore {
  cartpole: CartPoleState;
  rewardHistory: number[];
  mode: 'stopped' | 'training' | 'inference';
  episodeCount: number;
  algorithm: AlgorithmType;

  updateState: (s: CartPoleState) => void;
  recordEpisode: (totalReward: number) => void;
  setMode: (mode: 'stopped' | 'training' | 'inference') => void;
  setAlgorithm: (a: AlgorithmType) => void;
  resetStats: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  cartpole: { x: 0, xDot: 0, theta: 0, thetaDot: 0, stepCount: 0 },
  rewardHistory: [],
  mode: 'stopped',
  episodeCount: 0,
  algorithm: 'dqn',

  updateState: (cartpole) => set({ cartpole }),
  recordEpisode: (r) => set((s) => ({ rewardHistory: [...s.rewardHistory, r], episodeCount: s.episodeCount + 1 })),
  setMode: (mode) => set({ mode }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  resetStats: () => set({ rewardHistory: [], episodeCount: 0 }),
}));
