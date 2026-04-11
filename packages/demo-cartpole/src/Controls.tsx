import type { AlgorithmType } from '@ignitionai/core';
import { useDemoStore } from './store';

interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onInfer: () => void;
}

const ALGOS: { value: AlgorithmType; label: string }[] = [
  { value: 'dqn', label: 'DQN' },
  { value: 'ppo', label: 'PPO' },
];

export function Controls({ onStart, onStop, onReset, onInfer }: ControlsProps) {
  const { mode, algorithm, setAlgorithm } = useDemoStore();

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
      {mode === 'stopped' && <button onClick={onStart} style={btn('#22c55e')}>Train</button>}
      {mode === 'training' && <button onClick={onStop} style={btn('#ef4444')}>Stop</button>}
      {mode === 'training' && <button onClick={onInfer} style={btn('#3b82f6')}>Inference</button>}
      {mode === 'inference' && <button onClick={onStart} style={btn('#22c55e')}>Train</button>}
      {mode === 'inference' && <button onClick={onStop} style={btn('#ef4444')}>Stop</button>}
      <button onClick={onReset} style={btn('#6366f1')}>Reset</button>
      <select
        value={algorithm}
        onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
        style={{ padding: '8px 12px', background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #555', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}
      >
        {ALGOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>
      {mode !== 'stopped' && (
        <span style={{ fontSize: 12, color: mode === 'training' ? '#22c55e' : '#3b82f6', fontWeight: 600 }}>
          {mode === 'training' ? 'TRAINING' : 'INFERENCE'}
        </span>
      )}
    </div>
  );
}

function btn(c: string): React.CSSProperties {
  return { padding: '8px 24px', background: c, color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
}
