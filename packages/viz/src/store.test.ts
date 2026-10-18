import { describe, expect, it } from 'vitest';
import { createMetricsStore } from './store';
import type { TrainingFrame } from './types';

const frame = (episode: number, success: boolean): TrainingFrame => ({
  episode,
  reward: episode,
  steps: 10,
  success,
});

describe('createMetricsStore', () => {
  it('calcule le taux de succès glissant sur la fenêtre', () => {
    const store = createMetricsStore({ successWindow: 4 });
    for (const s of [true, true, false, true]) store.getState().pushTrainingFrame(frame(1, s));
    expect(store.getState().successRate).toBeCloseTo(0.75);
    // La fenêtre glisse : on pousse un échec, le premier succès sort
    store.getState().pushTrainingFrame(frame(5, false));
    expect(store.getState().successRate).toBeCloseTo(0.5);
  });

  it('borne le nombre de frames conservées', () => {
    const store = createMetricsStore({ maxFrames: 10 });
    for (let i = 0; i < 25; i++) store.getState().pushTrainingFrame(frame(i, true));
    expect(store.getState().trainingFrames).toHaveLength(10);
    expect(store.getState().trainingFrames[0].episode).toBe(15);
  });

  it('reset vide les deux modes', () => {
    const store = createMetricsStore();
    store.getState().pushTrainingFrame(frame(1, true));
    store.getState().pushInferenceFrame({ step: 0, action: 1 });
    store.getState().reset();
    expect(store.getState().trainingFrames).toHaveLength(0);
    expect(store.getState().inferenceFrames).toHaveLength(0);
    expect(store.getState().successRate).toBe(0);
  });
});
