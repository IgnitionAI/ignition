import { createRoot } from 'react-dom/client';

import { MetricsDashboard } from '@ignitionai/viz';

import { metricsStore } from './metricsStore';

/** Monte le dashboard de métriques (@ignitionai/viz) en panneau flottant à droite de la scène 3D. */
export function mountMetricsPanel(): void {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;top:20px;right:20px;width:360px;max-height:90vh;overflow-y:auto;z-index:1000;';
  document.body.appendChild(container);
  createRoot(container).render(<MetricsDashboard store={metricsStore} />);
}
