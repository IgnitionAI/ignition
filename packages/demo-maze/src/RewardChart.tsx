import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useDemoStore } from './store';

const MAX_POINTS = 300;

export function RewardChart() {
  const { rewardHistory } = useDemoStore();
  const firstEpisode = Math.max(0, rewardHistory.length - MAX_POINTS) + 1;
  const data = rewardHistory
    .slice(-MAX_POINTS)
    .map((reward, i) => ({ episode: firstEpisode + i, reward }));

  if (data.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', paddingTop: 78 }}>
        Press Train to begin
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="episode" stroke="#6b7280" fontSize={11} />
        <YAxis stroke="#6b7280" fontSize={11} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 12 }}
          labelStyle={{ color: '#e5e7eb' }}
        />
        <Line type="monotone" dataKey="reward" stroke="#22c55e" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
