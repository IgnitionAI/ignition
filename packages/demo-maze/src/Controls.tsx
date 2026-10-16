import type React from 'react';
import type { AlgorithmType } from '@ignitionai/core';
import { useDemoStore } from './store';

interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onInfer: () => void;
}

const ALGOS: { value: AlgorithmType; label: string }[] = [
  { value: 'qtable', label: 'Q-Table' },
  { value: 'dqn', label: 'DQN' },
  { value: 'ppo', label: 'PPO' },
];

export function Controls({ onStart, onStop, onReset, onInfer }: ControlsProps) {
  const { mode, algorithm, setAlgorithm, episodeCount, stepCount } = useDemoStore();

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px 20px',
      borderTop: '1px solid #1f2937',
      borderBottom: '1px solid #1f2937',
      background: '#080b12',
    }}>
      {mode === 'stopped' && <button onClick={onStart} style={btn('#16a34a')}>Train</button>}
      {mode === 'training' && <button onClick={onStop} style={btn('#dc2626')}>Stop</button>}
      {mode === 'training' && <button onClick={onInfer} style={btn('#2563eb')}>Inference</button>}
      {mode === 'inference' && <button onClick={onStart} style={btn('#16a34a')}>Train</button>}
      {mode === 'inference' && <button onClick={onStop} style={btn('#dc2626')}>Stop</button>}
      <button onClick={onReset} style={btn('#4f46e5')}>Reset</button>
      <select
        value={algorithm}
        onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
        disabled={mode !== 'stopped'}
        style={{
          height: 36,
          padding: '0 12px',
          background: '#111827',
          color: '#e5e7eb',
          border: '1px solid #374151',
          borderRadius: 6,
        }}
      >
        {ALGOS.map((algo) => <option key={algo.value} value={algo.value}>{algo.label}</option>)}
      </select>
      <span style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }}>
        Episodes {episodeCount} · Steps {stepCount}
      </span>
      {mode !== 'stopped' && (
        <span style={{ color: mode === 'training' ? '#22c55e' : '#60a5fa', fontSize: 12, fontWeight: 700 }}>
          {mode === 'training' ? 'TRAINING' : 'INFERENCE'}
        </span>
      )}
    </div>
  );
}

function btn(background: string): React.CSSProperties {
  return {
    minWidth: 96,
    height: 36,
    padding: '0 18px',
    background,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  };
}
