import {
  CartesianGrid,
  Line,
  LineChart,
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
const chartBox: CSSProperties = { width: '100%', height: 180, marginBottom: 8 };

function Chart({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div style={chartBox}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{title}</div>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  );
}

export function TrainingDashboard({ store }: { store: MetricsStore }) {
  const frames = useMetrics(store, (s) => s.trainingFrames);
  const successRate = useMetrics(store, (s) => s.successRate);
  const last = frames[frames.length - 1];
  const bestReward = frames.reduce((max, f) => Math.max(max, f.reward), -Infinity);

  return (
    <div>
      <div style={gridStyle}>
        <StatCard label="Épisode" value={last?.episode ?? 0} />
        <StatCard label="Reward" value={last ? last.reward.toFixed(2) : '—'} />
        <StatCard label="Best reward" value={frames.length ? bestReward.toFixed(2) : '—'} />
        <StatCard label="Succès (100 derniers)" value={`${(successRate * 100).toFixed(0)} %`} />
        {last?.epsilon !== undefined && <StatCard label="Epsilon" value={last.epsilon.toFixed(3)} />}
      </div>
      <Chart title="Reward par épisode">
        <LineChart data={frames}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="episode" stroke="#888" fontSize={11} />
          <YAxis stroke="#888" fontSize={11} />
          <Tooltip />
          <Line type="monotone" dataKey="reward" stroke="#4f9dff" dot={false} isAnimationActive={false} />
        </LineChart>
      </Chart>
      {frames.some((f) => f.loss !== undefined) && (
        <Chart title="Loss">
          <LineChart data={frames}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="episode" stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="loss" stroke="#ff6b6b" dot={false} isAnimationActive={false} />
          </LineChart>
        </Chart>
      )}
      {frames.some((f) => f.epsilon !== undefined) && (
        <Chart title="Epsilon">
          <LineChart data={frames}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="episode" stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} domain={[0, 1]} />
            <Tooltip />
            <Line type="monotone" dataKey="epsilon" stroke="#ffd166" dot={false} isAnimationActive={false} />
          </LineChart>
        </Chart>
      )}
    </div>
  );
}
