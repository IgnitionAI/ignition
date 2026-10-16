import { useState } from 'react'

interface Props {
  onTrain: () => void
  onInfer: () => void
  onReset: () => void
  onSpeedChange: (speed: number) => void
}

export function Controls({ onTrain, onInfer, onReset, onSpeedChange }: Props) {
  const [speed, setSpeed] = useState(25)

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 0',
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={onTrain}
        style={{
          padding: '10px 22px',
          background: '#22c55e',
          color: '#0a0a1a',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Train
      </button>
      <button
        onClick={onInfer}
        style={{
          padding: '10px 22px',
          background: '#3b82f6',
          color: '#0a0a1a',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Infer
      </button>
      <button
        onClick={onReset}
        style={{
          padding: '10px 22px',
          background: '#334155',
          color: '#e2e8f0',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Reset
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12 }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>Speed:</span>
        <input
          type="range"
          min={1}
          max={50}
          value={speed}
          onChange={(e) => {
            const v = Number(e.target.value)
            setSpeed(v)
            onSpeedChange(v)
          }}
          style={{ width: 160 }}
        />
        <span style={{ color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', minWidth: 28 }}>
          {speed}×
        </span>
      </div>
    </div>
  )
}
