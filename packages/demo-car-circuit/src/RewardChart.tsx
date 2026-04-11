import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDemoStore } from './store';

export function RewardChart() {
  const { rewardHistory } = useDemoStore();
  const data = rewardHistory.slice(-300).map((r, i) => ({ ep: rewardHistory.length - 300 + i + 1, steps: r }));

  if (data.length === 0) return <div style={{ color: '#666', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Press Train to begin</div>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
        <XAxis dataKey="ep" stroke="#666" fontSize={10} />
        <YAxis stroke="#666" fontSize={10} />
        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', fontSize: 11 }} />
        <Line type="monotone" dataKey="steps" stroke="#22c55e" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
