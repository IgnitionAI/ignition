import { create } from 'zustand';
import type { AlgorithmType } from '@ignitionai/core';

interface DemoStore {
  carX: number;
  carY: number;
  carAngle: number;
  stepCount: number;
  laps: number;
  mode: 'stopped' | 'training' | 'inference';
  rewardHistory: number[];
  episodeCount: number;
  algorithm: AlgorithmType;
  trail: [number, number][];

  updateCar: (s: { carX: number; carY: number; carAngle: number; stepCount: number; laps: number }) => void;
  recordEpisode: (r: number) => void;
  setMode: (m: 'stopped' | 'training' | 'inference') => void;
  setAlgorithm: (a: AlgorithmType) => void;
  resetStats: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  carX: 0,
  carY: 0,
  carAngle: 0,
  stepCount: 0,
  laps: 0,
  mode: 'stopped',
  rewardHistory: [],
  episodeCount: 0,
  algorithm: 'dqn',
  trail: [],

  updateCar: ({ carX, carY, carAngle, stepCount, laps }) =>
    set((s) => ({
      carX, carY, carAngle, stepCount, laps,
      trail: [...s.trail.slice(-59), [carX, carY] as [number, number]],
    })),
  recordEpisode: (r) =>
    set((s) => ({ rewardHistory: [...s.rewardHistory, r], episodeCount: s.episodeCount + 1 })),
  setMode: (mode) => set({ mode }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  resetStats: () => set({ rewardHistory: [], episodeCount: 0, trail: [] }),
}));
