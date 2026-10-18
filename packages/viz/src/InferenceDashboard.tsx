import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CSSProperties } from 'react';
import type { MetricsStore } from './store';
import { useMetrics } from './store';
import { StatCard } from './StatCard';

const gridStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 };

export function InferenceDashboard({ store }: { store: MetricsStore }) {
  const frames = useMetrics(store, (s) => s.inferenceFrames);
  const last = frames[frames.length - 1];
  const finished = frames.filter((f) => f.done);
  const successes = finished.filter((f) => f.success).length;
  const totalReward = frames.reduce((sum, f) => sum + (f.reward ?? 0), 0);
  const qData = (last?.qValues ?? []).map((q, i) => ({ action: `a${i}`, q }));

  return (
    <div>
      <div style={gridStyle}>
        <StatCard label="Step" value={last?.step ?? 0} />
        <StatCard label="Dernière action" value={last ? `a${last.action}` : '—'} />
        <StatCard label="Reward cumulé" value={totalReward.toFixed(2)} />
        {finished.length > 0 && (
          <StatCard
            label="Réussite"
            value={`${successes}/${finished.length}`}
          />
        )}
      </div>
      {qData.length > 0 && (
        <div style={{ width: '100%', height: 180 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Q-values (dernier step)</div>
          <ResponsiveContainer>
            <BarChart data={qData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="action" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip />
              <Bar dataKey="q" isAnimationActive={false}>
                {qData.map((entry, i) => (
                  <Cell key={entry.action} fill={i === last?.action ? '#4f9dff' : '#555'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
