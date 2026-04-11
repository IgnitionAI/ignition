import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useDemoStore } from './store';

const MAX_POINTS = 300;

export function RewardChart() {
  const { rewardHistory } = useDemoStore();

  const data = rewardHistory
    .slice(-MAX_POINTS)
    .map((reward, i) => ({ episode: rewardHistory.length - MAX_POINTS + i + 1, reward }));

  if (data.length === 0) {
    return (
      <div style={{ color: '#666', fontSize: 13, textAlign: 'center', paddingTop: 80 }}>
        Press Start to begin training
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
        <XAxis dataKey="episode" stroke="#666" fontSize={11} />
        <YAxis stroke="#666" fontSize={11} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #333', fontSize: 12 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Line type="monotone" dataKey="reward" stroke="#6366f1" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
