import { create } from 'zustand';
import type { AlgorithmType } from '@ignitionai/core';

interface DemoStore {
  position: number;
  velocity: number;
  stepCount: number;
  rewardHistory: number[];
  mode: 'stopped' | 'training' | 'inference';
  episodeCount: number;
  algorithm: AlgorithmType;

  updatePhysics: (pos: number, vel: number, steps: number) => void;
  recordEpisode: (totalReward: number) => void;
  setMode: (mode: 'stopped' | 'training' | 'inference') => void;
  setAlgorithm: (a: AlgorithmType) => void;
  resetStats: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  position: -0.5,
  velocity: 0,
  stepCount: 0,
  rewardHistory: [],
  mode: 'stopped',
  episodeCount: 0,
  algorithm: 'dqn',

  updatePhysics: (position, velocity, stepCount) => set({ position, velocity, stepCount }),
  recordEpisode: (r) => set((s) => ({ rewardHistory: [...s.rewardHistory, r], episodeCount: s.episodeCount + 1 })),
  setMode: (mode) => set({ mode }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  resetStats: () => set({ rewardHistory: [], episodeCount: 0, stepCount: 0 }),
}));
