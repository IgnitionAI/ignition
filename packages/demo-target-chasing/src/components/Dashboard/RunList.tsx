import { useState, useCallback } from 'react';
import { useRunStore } from '../../stores/runStore';
import type { TrainingRun } from '../../types/runs';

type SortKey = 'date' | 'reward' | 'episodes';

function lastReward(run: TrainingRun): number {
  if (run.episodes.length === 0) return -Infinity;
  const last50 = run.episodes.slice(-50);
  return last50.reduce((s, e) => s + e.reward, 0) / last50.length;
}

export function RunList() {
  const { runs, selectedRunIds, activeRunId, selectRun, deselectRun, renameRun, deleteRun, exportRun } = useRunStore();
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const sorted = [...runs].sort((a, b) => {
    if (sortBy === 'reward') return lastReward(b) - lastReward(a);
    if (sortBy === 'episodes') return b.episodes.length - a.episodes.length;
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
  });

  const toggleSelect = useCallback((id: string) => {
    if (selectedRunIds.includes(id)) {
      deselectRun(id);
    } else {
      selectRun(id);
    }
  }, [selectedRunIds, selectRun, deselectRun]);

  const startRename = useCallback((run: TrainingRun) => {
    setEditingId(run.id);
    setDraft(run.name);
  }, []);

  const commitRename = useCallback(() => {
    if (editingId && draft.trim()) {
      renameRun(editingId, draft.trim());
    }
    setEditingId(null);
  }, [editingId, draft, renameRun]);

  const handleExport = useCallback((id: string) => {
    const json = exportRun(id);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportRun]);

  return (
    <div style={{ width: 280, borderRight: '1px solid #333', padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h4 style={{ margin: 0, color: '#e2e8f0' }}>Runs</h4>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          style={{ fontSize: 11, background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #555', borderRadius: 3, padding: '2px 4px' }}
        >
          <option value="date">By date</option>
          <option value="reward">By reward</option>
          <option value="episodes">By episodes</option>
        </select>
      </div>

      {sorted.length === 0 && (
        <p style={{ color: '#888', fontSize: 12 }}>No runs yet. Start training to record a run.</p>
      )}

      {sorted.map((run) => {
        const isActive = run.id === activeRunId;
        const isSelected = selectedRunIds.includes(run.id);
        const avgReward = run.episodes.length > 0 ? lastReward(run).toFixed(2) : '—';

        return (
          <div
            key={run.id}
            style={{
              padding: 8,
              marginBottom: 6,
              borderRadius: 4,
              background: isSelected ? '#2a2a4e' : '#1a1a2e',
              border: `1px solid ${isActive ? '#22c55e' : isSelected ? '#6366f1' : '#333'}`,
              fontSize: 12,
              color: '#e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(run.id)}
                style={{ accentColor: '#6366f1' }}
              />
              {editingId === run.id ? (
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                  autoFocus
                  style={{ flex: 1, fontSize: 12, background: '#0a0a1e', color: '#e2e8f0', border: '1px solid #6366f1', borderRadius: 3, padding: '1px 4px' }}
                />
              ) : (
                <span
                  onClick={() => startRename(run)}
                  style={{ flex: 1, cursor: 'pointer', fontWeight: 600 }}
                  title="Click to rename"
                >
                  {run.name} {isActive && '(live)'}
                </span>
              )}
            </div>
            <div style={{ marginTop: 4, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
              <span>{run.episodes.length} ep</span>
              <span>avg {avgReward}</span>
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
              <button onClick={() => handleExport(run.id)} style={btnStyle}>Export</button>
              <button onClick={() => deleteRun(run.id)} style={{ ...btnStyle, color: '#ef4444' }}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  fontSize: 10,
  padding: '2px 6px',
  background: 'transparent',
  color: '#aaa',
  border: '1px solid #555',
  borderRadius: 3,
  cursor: 'pointer',
};
