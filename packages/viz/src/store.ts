import { createStore, useStore } from 'zustand';
import type { StoreApi } from 'zustand';
import type { InferenceFrame, TrainingFrame } from './types';

export interface MetricsState {
  trainingFrames: TrainingFrame[];
  inferenceFrames: InferenceFrame[];
  /** Taux de succès glissant sur les `successWindow` derniers épisodes (0–1). */
  successRate: number;
  pushTrainingFrame: (frame: TrainingFrame) => void;
  pushInferenceFrame: (frame: InferenceFrame) => void;
  reset: () => void;
}

export type MetricsStore = StoreApi<MetricsState>;

export interface MetricsStoreOptions {
  /** Nombre max de frames conservées par mode (défaut 500). */
  maxFrames?: number;
  /** Fenêtre du taux de succès glissant (défaut 100 épisodes). */
  successWindow?: number;
}

export function createMetricsStore(options: MetricsStoreOptions = {}): MetricsStore {
  const maxFrames = options.maxFrames ?? 500;
  const successWindow = options.successWindow ?? 100;

  return createStore<MetricsState>((set, get) => ({
    trainingFrames: [],
    inferenceFrames: [],
    successRate: 0,
    pushTrainingFrame: (frame) => {
      const frames = [...get().trainingFrames, frame].slice(-maxFrames);
      const window = frames.slice(-successWindow);
      const successRate = window.filter((f) => f.success).length / window.length;
      set({ trainingFrames: frames, successRate });
    },
    pushInferenceFrame: (frame) => {
      set({ inferenceFrames: [...get().inferenceFrames, frame].slice(-maxFrames) });
    },
    reset: () => set({ trainingFrames: [], inferenceFrames: [], successRate: 0 }),
  }));
}

/** Hook React : sélecteur sur un store créé par `createMetricsStore`. */
export function useMetrics<T>(store: MetricsStore, selector: (state: MetricsState) => T): T {
  return useStore(store, selector);
}
