import type { AlgorithmType } from '@ignitionai/core';
import { useDemoStore } from './store';

interface ControlsProps { onStart: () => void; onStop: () => void; onReset: () => void; }

export function Controls({ onStart, onStop, onReset }: ControlsProps) {
  const { isTraining, algorithm, setAlgorithm } = useDemoStore();
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
      {!isTraining
        ? <button onClick={onStart} style={btn('#22c55e')}>Start</button>
        : <button onClick={onStop} style={btn('#ef4444')}>Stop</button>}
      <button onClick={onReset} style={btn('#6366f1')}>Reset</button>
      <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
        style={{ padding: '8px 12px', background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #555', borderRadius: 6, fontSize: 14 }}>
        <option value="dqn">DQN</option>
        <option value="ppo">PPO</option>
      </select>
    </div>
  );
}

function btn(c: string): React.CSSProperties {
  return { padding: '8px 24px', background: c, color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
}
