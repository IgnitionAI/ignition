import { useDemoStore } from './store'

export function HUD() {
  const episode = useDemoStore((s) => s.episode)
  const totalSteps = useDemoStore((s) => s.totalSteps)
  const captures = useDemoStore((s) => s.captures)
  const mode = useDemoStore((s) => s.mode)

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        padding: '10px 14px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid #334155',
        borderRadius: 8,
        color: '#e2e8f0',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.7,
        pointerEvents: 'none',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div>Episode: <strong>{episode}</strong></div>
      <div>Steps: <strong>{totalSteps}</strong></div>
      <div>Captures: <strong style={{ color: '#A5B4FC' }}>{captures}</strong></div>
      <div>Mode: <strong style={{ color: mode === 'training' ? '#22c55e' : mode === 'inference' ? '#3b82f6' : '#888' }}>{mode.toUpperCase()}</strong></div>
    </div>
  )
}
