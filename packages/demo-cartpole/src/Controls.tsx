import type { AlgorithmType } from '@ignitionai/core';
import { useDemoStore } from './store';

interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const ALGOS: { value: AlgorithmType; label: string }[] = [
  { value: 'dqn', label: 'DQN' },
  { value: 'ppo', label: 'PPO' },
];

export function Controls({ onStart, onStop, onReset }: ControlsProps) {
  const { isTraining, algorithm, setAlgorithm } = useDemoStore();

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
      {!isTraining ? (
        <button onClick={onStart} style={btnStyle('#22c55e')}>Start</button>
      ) : (
        <button onClick={onStop} style={btnStyle('#ef4444')}>Stop</button>
      )}
      <button onClick={onReset} style={btnStyle('#6366f1')}>Reset</button>
      <select
        value={algorithm}
        onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
        style={{ padding: '8px 12px', background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #555', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}
      >
        {ALGOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return { padding: '8px 24px', background: color, color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
}
