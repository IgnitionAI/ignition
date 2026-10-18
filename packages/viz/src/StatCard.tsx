import type { CSSProperties, ReactNode } from 'react';

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 12px',
  border: '1px solid #333',
  borderRadius: 6,
  minWidth: 90,
  background: '#1a1a1a',
  color: '#eee',
};

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={cardStyle}>
      <span style={{ fontSize: 11, opacity: 0.7 }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
