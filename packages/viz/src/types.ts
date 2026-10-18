/** Une frame poussée par le consommateur à la fin de chaque épisode d'entraînement. */
export interface TrainingFrame {
  episode: number;
  reward: number;
  steps: number;
  loss?: number;
  epsilon?: number;
  success: boolean;
}

/** Une frame poussée à chaque step d'inférence. */
export interface InferenceFrame {
  step: number;
  action: number;
  qValues?: number[];
  reward?: number;
  done?: boolean;
  success?: boolean;
}
