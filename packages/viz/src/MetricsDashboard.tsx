import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { MetricsStore } from './store';
import { TrainingDashboard } from './TrainingDashboard';
import { InferenceDashboard } from './InferenceDashboard';

const containerStyle: CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  background: '#111',
  color: '#eee',
  padding: 12,
  borderRadius: 8,
};

const tabStyle = (active: boolean): CSSProperties => ({
  padding: '4px 12px',
  marginRight: 4,
  border: '1px solid #333',
  borderRadius: 4,
  background: active ? '#4f9dff' : 'transparent',
  color: active ? '#111' : '#eee',
  cursor: 'pointer',
});

/** Dashboard standard avec bascule training ↔ inference. */
export function MetricsDashboard({ store }: { store: MetricsStore }) {
  const [mode, setMode] = useState<'training' | 'inference'>('training');

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 12 }}>
        <button style={tabStyle(mode === 'training')} onClick={() => setMode('training')}>
          Training
        </button>
        <button style={tabStyle(mode === 'inference')} onClick={() => setMode('inference')}>
          Inference
        </button>
      </div>
      {mode === 'training' ? <TrainingDashboard store={store} /> : <InferenceDashboard store={store} />}
    </div>
  );
}
