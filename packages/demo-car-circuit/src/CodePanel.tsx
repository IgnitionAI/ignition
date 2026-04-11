import { useDemoStore } from './store';

export function CodePanel() {
  const { algorithm } = useDemoStore();
  const code = `import { IgnitionEnvTFJS } from 'ignitionai';
import { CircuitEnv } from './circuit-env';

const circuit = new CircuitEnv();

const env = new IgnitionEnvTFJS(circuit);
env.train('${algorithm}');

// Switch to inference after training:
// env.infer();`;

  return (
    <pre style={{ background: '#0d1117', borderRadius: 8, padding: 14, border: '1px solid #333', fontSize: 12, lineHeight: 1.7, color: '#e2e8f0', fontFamily: "'Fira Code', monospace", margin: 0, overflow: 'auto' }}>
      <span style={{ color: '#888', fontSize: 10 }}>// That's it. 7 lines.</span>{'\n'}
      {code}
    </pre>
  );
}
