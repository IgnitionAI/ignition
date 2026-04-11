import { useDemoStore } from './store';

export function CodePanel() {
  const { algorithm } = useDemoStore();
  const code = `import { IgnitionEnv } from '@ignitionai/backend-tfjs';
import { MountainCarEnv } from './mountaincar-env';

const car = new MountainCarEnv();

const env = new IgnitionEnv({
  getObservation: () => car.observe(),
  actions: ['push_left', 'none', 'push_right'],
  applyAction: (a) => car.step(a),
  computeReward: () => car.reward(),
  isTerminated: () => car.done(),
  onReset: () => car.reset(),
});

env.train('${algorithm}');`;

  return (
    <div style={{ background: '#0d1117', borderRadius: 8, padding: 16, border: '1px solid #333', overflow: 'auto' }}>
      <div style={{ color: '#888', fontSize: 11, marginBottom: 8, fontFamily: 'monospace' }}>// Your code — that's it.</div>
      <pre style={{ margin: 0, fontFamily: "'Fira Code', monospace", fontSize: 13, lineHeight: 1.6, color: '#e2e8f0' }}>
        {code.split('\n').map((line, i) => (
          <div key={i}>
            <span style={{ color: '#666', marginRight: 12, userSelect: 'none' }}>{String(i + 1).padStart(2)}</span>
            <span>{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
