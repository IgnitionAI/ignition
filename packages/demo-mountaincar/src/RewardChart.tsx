import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDemoStore } from './store';

export function RewardChart() {
  const { rewardHistory } = useDemoStore();
  const data = rewardHistory.slice(-300).map((r, i) => ({ episode: rewardHistory.length - 300 + i + 1, reward: r }));

  if (data.length === 0) {
    return <div style={{ color: '#666', fontSize: 13, textAlign: 'center', paddingTop: 80 }}>Press Start to begin training</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
        <XAxis dataKey="episode" stroke="#666" fontSize={11} />
        <YAxis stroke="#666" fontSize={11} label={{ value: 'Reward (higher = faster)', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', fontSize: 12 }} />
        <Line type="monotone" dataKey="reward" stroke="#f59e0b" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
