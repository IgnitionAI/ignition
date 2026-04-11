import { useDemoStore } from './store';

export function HUD() {
  const { episodeCount, laps, stepCount, mode } = useDemoStore();

  const modeColor = mode === 'training' ? '#22c55e' : mode === 'inference' ? '#3b82f6' : '#888';

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: 12,
      background: 'rgba(10, 10, 26, 0.75)',
      padding: '10px 14px',
      borderRadius: 10,
      fontSize: 12,
      fontFamily: 'monospace',
      color: '#e2e8f0',
      lineHeight: 1.8,
      pointerEvents: 'none',
      border: '1px solid rgba(99, 102, 241, 0.3)',
    }}>
      <div>Episode: <span style={{ color: '#fff', fontWeight: 700 }}>{episodeCount}</span></div>
      <div>Laps: <span style={{ color: '#fff', fontWeight: 700 }}>{laps}</span></div>
      <div>Steps: <span style={{ color: '#fff', fontWeight: 700 }}>{stepCount}</span></div>
      <div>Mode: <span style={{ color: modeColor, fontWeight: 700 }}>{mode.toUpperCase()}</span></div>
    </div>
  );
}
