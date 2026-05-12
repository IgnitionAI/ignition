import type React from 'react';
import { useDemoStore } from './store';

export function CodePanel() {
  const { algorithm } = useDemoStore();

  const code = `import { IgnitionEnvTFJS } from 'ignitionai';
import type { TrainingEnv } from 'ignitionai';

class MazeEnv implements TrainingEnv {
  actions = mazeActions;

  observe() { return arena.sensors(); }
  step(action) { arena.apply(action); }
  reward() { return arena.reward(); }
  done() { return arena.done(); }
  reset() { arena.reset(); }
}

const maze = new MazeEnv();
const trainer = new IgnitionEnvTFJS(maze);
trainer.train('${algorithm}');`;

  return (
    <div style={{ background: '#0d1117', borderRadius: 8, padding: 16, border: '1px solid #1f2937', overflow: 'auto' }}>
      <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 8, fontFamily: 'monospace' }}>
        // Rapier scene, tiny RL loop
      </div>
      <pre style={{ margin: 0, fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: 12.5, lineHeight: 1.55, color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>
        {code.split('\n').map((line, i) => (
          <div key={i}>
            <span style={{ color: '#4b5563', marginRight: 12, userSelect: 'none' }}>{String(i + 1).padStart(2)}</span>
            {highlightLine(line)}
          </div>
        ))}
      </pre>
    </div>
  );
}

function highlightLine(line: string): React.JSX.Element {
  const highlighted = line
    .replace(/(import|from|const|new)/g, '<kw>$1</kw>')
    .replace(/('.*?')/g, '<str>$1</str>')
    .replace(/(\/\/.*)/g, '<cmt>$1</cmt>')
    .replace(/(\.\w+)\(/g, '<fn>$1</fn>(');

  const parts = highlighted.split(/(<\/?(?:kw|str|cmt|fn)>)/);
  const elements: React.JSX.Element[] = [];
  let currentTag: string | null = null;
  const colors: Record<string, string> = { kw: '#c084fc', str: '#86efac', cmt: '#6b7280', fn: '#60a5fa' };

  parts.forEach((part, i) => {
    if (part.startsWith('<') && !part.startsWith('</')) {
      currentTag = part.replace(/<|>/g, '');
    } else if (part.startsWith('</')) {
      currentTag = null;
    } else if (part) {
      elements.push(<span key={i} style={currentTag ? { color: colors[currentTag] } : undefined}>{part}</span>);
    }
  });

  return <>{elements}</>;
}
