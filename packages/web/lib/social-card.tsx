import { ImageResponse } from 'next/og'

export const socialCardSize = { width: 1200, height: 630 }

export function renderSocialCard(title: string, subtitle: string) {
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0f172a', color: '#f1f5f9', padding: '64px 72px', borderTop: '12px solid #818cf8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#a5b4fc', fontSize: 32, fontWeight: 700 }}>
        <svg width="44" height="54" viewBox="0 0 44 54"><path d="M24 0C28 17 5 19 5 35a17 17 0 0 0 34 0c0-9-5-15-8-18 0 9-5 12-8 13 8-14 4-23 1-30Z" fill="#818cf8" /></svg>
        IgnitionAI
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', fontSize: title.length > 65 ? 56 : 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
      <div style={{ display: 'flex', fontSize: 28, color: '#cbd5e1', marginBottom: 24 }}>{subtitle}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, color: '#94a3b8' }}><span>JavaScript · Reinforcement learning</span><span>ignitionai.dev</span></div>
    </div>,
    socialCardSize,
  )
}
