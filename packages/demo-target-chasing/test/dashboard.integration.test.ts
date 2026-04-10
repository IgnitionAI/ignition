import { describe, it, expect, beforeEach } from 'vitest';
import { useRunStore } from '../src/stores/runStore';

describe('Dashboard integration', () => {
  beforeEach(() => {
    useRunStore.setState({ runs: [], selectedRunIds: [], activeRunId: null });
  });

  it('full lifecycle: start → record episodes → end → verify metrics', () => {
    const store = useRunStore.getState();
    const id = store.startRun({ lr: 0.001, hiddenLayers: [64, 64] });

    // Simulate 5 episodes
    for (let ep = 1; ep <= 5; ep++) {
      store.recordEpisode({ reward: ep * 2, epsilon: 1 - ep * 0.1, steps: 20 + ep });
    }

    store.endRun();

    const state = useRunStore.getState();
    const run = state.runs.find((r) => r.id === id)!;

    expect(run.episodes).toHaveLength(5);
    expect(run.episodes[0].reward).toBe(2);
    expect(run.episodes[4].reward).toBe(10);
    expect(run.episodes[4].episode).toBe(5);
    expect(run.endedAt).not.toBeNull();
    expect(state.activeRunId).toBeNull();
  });

  it('two runs selected → both accessible for chart data', () => {
    const store = useRunStore.getState();

    // Run 1
    const id1 = store.startRun({ lr: 0.001 });
    store.recordEpisode({ reward: 1, epsilon: 0.9, steps: 10 });
    store.recordEpisode({ reward: 3, epsilon: 0.8, steps: 12 });
    store.endRun();

    // Run 2
    const id2 = store.startRun({ lr: 0.01 });
    store.recordEpisode({ reward: 2, epsilon: 0.95, steps: 8 });
    store.recordEpisode({ reward: 5, epsilon: 0.85, steps: 9 });
    store.recordEpisode({ reward: 7, epsilon: 0.75, steps: 11 });
    store.endRun();

    // Select both
    store.selectRun(id1);
    store.selectRun(id2);

    const state = useRunStore.getState();
    expect(state.selectedRunIds).toHaveLength(2);

    const selectedRuns = state.runs.filter((r) => state.selectedRunIds.includes(r.id));
    expect(selectedRuns).toHaveLength(2);

    // Chart would show max 3 episodes (from run2)
    const maxEpisodes = Math.max(...selectedRuns.map((r) => r.episodes.length));
    expect(maxEpisodes).toBe(3);

    // Both runs have distinct data
    const run1 = selectedRuns.find((r) => r.id === id1)!;
    const run2 = selectedRuns.find((r) => r.id === id2)!;
    expect(run1.episodes[0].reward).toBe(1);
    expect(run2.episodes[0].reward).toBe(2);
  });

  it('rename persists and export includes new name', () => {
    const store = useRunStore.getState();
    const id = store.startRun({});
    store.recordEpisode({ reward: 42, epsilon: 0.5, steps: 100 });
    store.endRun();

    store.renameRun(id, 'Best PPO Run');

    const json = store.exportRun(id);
    const parsed = JSON.parse(json!);
    expect(parsed.name).toBe('Best PPO Run');
    expect(parsed.episodes[0].reward).toBe(42);
  });
});
