import { useState } from 'react';
import type { AlgorithmType } from '@ignitionai/core';
import { useDemoStore } from './store';

interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onInfer: () => void;
  onSpeedChange: (multiplier: number) => void;
}

const SPEEDS = [
  { label: '1x', value: 1 },
  { label: '5x', value: 5 },
  { label: '10x', value: 10 },
  { label: '25x', value: 25 },
  { label: '50x', value: 50 },
];

export function Controls({ onStart, onStop, onReset, onInfer, onSpeedChange }: ControlsProps) {
  const { mode, algorithm, setAlgorithm, episodeCount, stepCount, laps } = useDemoStore();
  const [speed, setSpeed] = useState(1);

  const handleSpeed = (v: number) => {
    setSpeed(v);
    onSpeedChange(v);
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', padding: '12px 0', flexWrap: 'wrap' }}>
      {mode === 'stopped' && <button onClick={onStart} style={btn('#22c55e')}>Train</button>}
      {mode === 'training' && <button onClick={onStop} style={btn('#ef4444')}>Stop</button>}
      {mode === 'training' && <button onClick={onInfer} style={btn('#3b82f6')}>Inference</button>}
      {mode === 'inference' && <button onClick={onStart} style={btn('#22c55e')}>Train</button>}
      {mode === 'inference' && <button onClick={onStop} style={btn('#ef4444')}>Stop</button>}
      <button onClick={onReset} style={btn('#6366f1')}>Reset</button>

      <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
        style={selectStyle}>
        <option value="dqn">DQN</option>
        <option value="ppo">PPO</option>
      </select>

      {/* Speed control */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#888' }}>Speed:</span>
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            onClick={() => handleSpeed(s.value)}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: speed === s.value ? 700 : 400,
              background: speed === s.value ? '#6366f1' : 'transparent',
              color: speed === s.value ? '#fff' : '#888',
              border: `1px solid ${speed === s.value ? '#6366f1' : '#555'}`,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <span style={{ fontSize: 12, color: '#888' }}>Ep: {episodeCount} | Steps: {stepCount} | Laps: {laps}</span>
      {mode !== 'stopped' && (
        <span style={{ fontSize: 12, fontWeight: 700, color: mode === 'training' ? '#22c55e' : '#3b82f6' }}>
          {mode.toUpperCase()}
        </span>
      )}
    </div>
  );
}

function btn(c: string): React.CSSProperties {
  return { padding: '8px 24px', background: c, color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #555', borderRadius: 6, fontSize: 14,
};
