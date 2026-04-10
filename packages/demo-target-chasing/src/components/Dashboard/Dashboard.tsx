import { useRunStore } from '../../stores/runStore';
import { RunList } from './RunList';
import { RunChart } from './RunChart';

interface DashboardProps {
  currentConfig?: Record<string, unknown>;
}

export function Dashboard({ currentConfig }: DashboardProps) {
  const { startRun, endRun, activeRunId, clearAll, runs } = useRunStore();

  const handleNewRun = () => {
    if (activeRunId) {
      endRun();
    }
    startRun(currentConfig ?? {});
  };

  return (
    <div style={{ border: '1px solid #333', borderRadius: 6, background: '#0f0f1a', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #333' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 14 }}>Training Dashboard</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleNewRun} style={primaryBtn}>
            {activeRunId ? 'New Run (end current)' : 'New Run'}
          </button>
          {activeRunId && (
            <button onClick={endRun} style={secondaryBtn}>
              End Run
            </button>
          )}
          {runs.length > 0 && (
            <button onClick={clearAll} style={{ ...secondaryBtn, color: '#ef4444' }}>
              Clear All
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', minHeight: 350 }}>
        <RunList />
        <RunChart />
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '4px 12px',
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
};

const secondaryBtn: React.CSSProperties = {
  padding: '4px 12px',
  background: 'transparent',
  color: '#aaa',
  border: '1px solid #555',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
};
