import { create } from 'zustand';
import type { AlgorithmType } from '@ignitionai/core';
import { GOAL, START, movingHazards } from './maze-layout';

interface MazeState {
  agentX: number;
  agentZ: number;
  heading: number;
  goalX: number;
  goalZ: number;
  doorOpen: boolean;
  hazards: { id: string; x: number; z: number; radius: number }[];
  sensors: number[];
  trail: [number, number][];
  lastActionBlocked: boolean;
  lastHazardHit: boolean;
  lastAction: string;
}

interface DemoStore {
  maze: MazeState;
  rewardHistory: number[];
  mode: 'stopped' | 'training' | 'inference';
  episodeCount: number;
  stepCount: number;
  algorithm: AlgorithmType;

  updateMaze: (maze: MazeState) => void;
  recordEpisode: (totalReward: number) => void;
  setMode: (mode: 'stopped' | 'training' | 'inference') => void;
  setAlgorithm: (algo: AlgorithmType) => void;
  incrementStep: () => void;
  resetStats: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  maze: {
    agentX: START.x,
    agentZ: START.z,
    heading: START.heading,
    goalX: GOAL.x,
    goalZ: GOAL.z,
    doorOpen: false,
    hazards: movingHazards(0).map(({ id, x, z, radius }) => ({ id, x, z, radius })),
    sensors: [1, 1, 1, 1, 1, 1],
    trail: [],
    lastActionBlocked: false,
    lastHazardHit: false,
    lastAction: 'reset',
  },
  rewardHistory: [],
  mode: 'stopped',
  episodeCount: 0,
  stepCount: 0,
  algorithm: 'dqn',

  updateMaze: (maze) => set({ maze }),
  recordEpisode: (totalReward) =>
    set((s) => ({
      rewardHistory: [...s.rewardHistory, Number(totalReward.toFixed(2))],
      episodeCount: s.episodeCount + 1,
    })),
  setMode: (mode) => set({ mode }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  incrementStep: () => set((s) => ({ stepCount: s.stepCount + 1 })),
  resetStats: () => set({ rewardHistory: [], episodeCount: 0, stepCount: 0 }),
}));
