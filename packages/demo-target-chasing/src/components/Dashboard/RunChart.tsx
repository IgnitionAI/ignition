import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useRunStore } from '../../stores/runStore';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
const MAX_POINTS = 200;

function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  const result: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(arr[Math.floor(i * step)]);
  }
  return result;
}

export function RunChart() {
  const { runs, selectedRunIds } = useRunStore();

  const selectedRuns = useMemo(
    () => runs.filter((r) => selectedRunIds.includes(r.id)),
    [runs, selectedRunIds],
  );

  // Build merged data: each row = { episode, "run1": reward, "run2": reward, ... }
  const chartData = useMemo(() => {
    if (selectedRuns.length === 0) return [];

    const maxEpisodes = Math.max(...selectedRuns.map((r) => r.episodes.length));
    const data: Record<string, number | string>[] = [];

    for (let i = 0; i < maxEpisodes; i++) {
      const row: Record<string, number | string> = { episode: i + 1 };
      for (const run of selectedRuns) {
        if (i < run.episodes.length) {
          row[run.name] = run.episodes[i].reward;
        }
      }
      data.push(row);
    }

    return downsample(data, MAX_POINTS);
  }, [selectedRuns]);

  if (selectedRuns.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        Select runs from the list to compare
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 12 }}>
      <h4 style={{ color: '#e2e8f0', marginTop: 0 }}>Reward per Episode</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="episode"
            stroke="#888"
            fontSize={11}
            label={{ value: 'Episode', position: 'insideBottom', offset: -5, fill: '#888' }}
          />
          <YAxis stroke="#888" fontSize={11} />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid #555', fontSize: 12 }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {selectedRuns.map((run, idx) => (
            <Line
              key={run.id}
              type="monotone"
              dataKey={run.name}
              stroke={COLORS[idx % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
