import type { TrainingFrame } from '@ignitionai/viz';

/**
 * Accumule les métriques d'un épisode et émet une TrainingFrame à sa fin.
 * Découplé du reset interne de l'env (qui peut remettre ses compteurs à 0).
 */
export function createEpisodeTracker(onFrame: (frame: TrainingFrame) => void) {
  let episode = 0;
  let reward = 0;
  let steps = 0;

  return {
    /** À chaque step : accumule le reward reçu. */
    step(stepReward: number): void {
      reward += stepReward;
      steps++;
    },
    /** Fin d'épisode : émet la frame puis réinitialise l'accumulation. */
    end(success: boolean): void {
      episode++;
      onFrame({ episode, reward, steps, success });
      reward = 0;
      steps = 0;
    },
  };
}
