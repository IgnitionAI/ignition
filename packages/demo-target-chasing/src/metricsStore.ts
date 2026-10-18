import { createMetricsStore } from '@ignitionai/viz';

/** Store de métriques partagé : pousseurs (boucle d'entraînement) et dashboard React le consomment. */
export const metricsStore = createMetricsStore();
