import type React from 'react';
import { useDemoStore } from './store';

export function CodePanel() {
  const { algorithm } = useDemoStore();

  const code = `import { IgnitionEnv } from '@ignitionai/backend-tfjs';
import { GridWorldEnv } from './gridworld-env';

const grid = new GridWorldEnv(7);

const env = new IgnitionEnv({
  getObservation: () => grid.observe(),
  actions: ['up', 'right', 'down', 'left'],
  applyAction: (a) => grid.step(a),
  computeReward: () => grid.reward(),
  isTerminated: () => grid.done(),
  onReset: () => grid.reset(),
});

env.train('${algorithm}');`;

  return (
    <div style={{ background: '#0d1117', borderRadius: 8, padding: 16, border: '1px solid #333', overflow: 'auto' }}>
      <div style={{ color: '#888', fontSize: 11, marginBottom: 8, fontFamily: 'monospace' }}>
        // Your code — that's it.
      </div>
      <pre style={{ margin: 0, fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: 13, lineHeight: 1.6, color: '#e2e8f0' }}>
        {code.split('\n').map((line, i) => (
          <div key={i}>
            <span style={{ color: '#666', marginRight: 12, userSelect: 'none' }}>{String(i + 1).padStart(2)}</span>
            {highlightLine(line)}
          </div>
        ))}
      </pre>
    </div>
  );
}

function highlightLine(line: string): React.JSX.Element {
  // Minimal syntax highlighting via regex
  const highlighted = line
    .replace(/(import|from|const|new)/g, '<kw>$1</kw>')
    .replace(/('.*?')/g, '<str>$1</str>')
    .replace(/(\/\/.*)/g, '<cmt>$1</cmt>')
    .replace(/(\.\w+)\(/g, '<fn>$1</fn>(');

  const parts = highlighted.split(/(<\/?(?:kw|str|cmt|fn)>)/);
  const elements: React.JSX.Element[] = [];
  let currentTag: string | null = null;

  const colors: Record<string, string> = {
    kw: '#c678dd',
    str: '#98c379',
    cmt: '#5c6370',
    fn: '#61afef',
  };

  parts.forEach((part, i) => {
    if (part.startsWith('<') && !part.startsWith('</')) {
      currentTag = part.replace(/<|>/g, '');
    } else if (part.startsWith('</')) {
      currentTag = null;
    } else if (part) {
      elements.push(
        <span key={i} style={currentTag ? { color: colors[currentTag] } : undefined}>
          {part}
        </span>
      );
    }
  });

  return <>{elements}</>;
}
