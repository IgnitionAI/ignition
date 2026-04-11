import { create } from 'zustand';
import type { AlgorithmType } from '@ignitionai/core';

interface DemoStore {
  cartpole: { x: number; xDot: number; theta: number; thetaDot: number; stepCount: number };
  mode: 'stopped' | 'training' | 'inference';
  rewardHistory: number[];
  episodeCount: number;
  algorithm: AlgorithmType;

  updateState: (s: { x: number; xDot: number; theta: number; thetaDot: number; stepCount: number }) => void;
  recordEpisode: (r: number) => void;
  setMode: (m: 'stopped' | 'training' | 'inference') => void;
  setAlgorithm: (a: AlgorithmType) => void;
  resetStats: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  cartpole: { x: 0, xDot: 0, theta: 0, thetaDot: 0, stepCount: 0 },
  mode: 'stopped',
  rewardHistory: [],
  episodeCount: 0,
  algorithm: 'dqn',

  updateState: (cartpole) => set({ cartpole }),
  recordEpisode: (r) => set((s) => ({ rewardHistory: [...s.rewardHistory, r], episodeCount: s.episodeCount + 1 })),
  setMode: (mode) => set({ mode }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  resetStats: () => set({ rewardHistory: [], episodeCount: 0 }),
}));
