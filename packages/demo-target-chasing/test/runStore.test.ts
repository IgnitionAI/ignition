import { describe, it, expect, beforeEach } from 'vitest';
import { useRunStore } from '../src/stores/runStore';

describe('runStore', () => {
  beforeEach(() => {
    useRunStore.setState({
      runs: [],
      selectedRunIds: [],
      activeRunId: null,
    });
  });

  describe('startRun', () => {
    it('creates a new run with config and sets it active', () => {
      const store = useRunStore.getState();
      const id = store.startRun({ lr: 0.001, epsilon: 1.0 });

      const state = useRunStore.getState();
      expect(state.runs).toHaveLength(1);
      expect(state.activeRunId).toBe(id);
      expect(state.runs[0].config).toEqual({ lr: 0.001, epsilon: 1.0 });
      expect(state.runs[0].episodes).toEqual([]);
      expect(state.runs[0].endedAt).toBeNull();
    });

    it('auto-prunes oldest runs beyond 100', () => {
      const store = useRunStore.getState();
      // Add 101 runs
      for (let i = 0; i < 101; i++) {
        store.startRun({ run: i });
      }
      const state = useRunStore.getState();
      expect(state.runs.length).toBeLessThanOrEqual(100);
    });
  });

  describe('recordEpisode', () => {
    it('appends episode metrics to the active run', () => {
      const store = useRunStore.getState();
      store.startRun({ lr: 0.001 });
      store.recordEpisode({ reward: 5.0, epsilon: 0.9, steps: 25 });
      store.recordEpisode({ reward: 7.0, epsilon: 0.85, steps: 20 });

      const state = useRunStore.getState();
      const run = state.runs[0];
      expect(run.episodes).toHaveLength(2);
      expect(run.episodes[0]).toEqual({ episode: 1, reward: 5.0, epsilon: 0.9, steps: 25 });
      expect(run.episodes[1]).toEqual({ episode: 2, reward: 7.0, epsilon: 0.85, steps: 20 });
    });

    it('does nothing if no active run', () => {
      const store = useRunStore.getState();
      store.recordEpisode({ reward: 1, epsilon: 1, steps: 10 });
      expect(useRunStore.getState().runs).toHaveLength(0);
    });
  });

  describe('endRun', () => {
    it('sets endedAt and clears activeRunId', () => {
      const store = useRunStore.getState();
      const id = store.startRun({});
      store.endRun();

      const state = useRunStore.getState();
      expect(state.activeRunId).toBeNull();
      expect(state.runs.find((r) => r.id === id)?.endedAt).not.toBeNull();
    });
  });

  describe('selection', () => {
    it('selectRun adds to selectedRunIds', () => {
      const store = useRunStore.getState();
      const id = store.startRun({});
      store.endRun();
      store.selectRun(id);

      expect(useRunStore.getState().selectedRunIds).toContain(id);
    });

    it('selectRun caps at 5 selections', () => {
      // Pre-populate 6 runs with distinct IDs
      const ids = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
      useRunStore.setState({
        runs: ids.map((id) => ({
          id,
          name: id,
          config: {},
          episodes: [],
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        })),
        selectedRunIds: [],
        activeRunId: null,
      });
      const store = useRunStore.getState();
      for (const id of ids) {
        store.selectRun(id);
      }
      expect(useRunStore.getState().selectedRunIds).toHaveLength(5);
    });

    it('deselectRun removes from selectedRunIds', () => {
      const store = useRunStore.getState();
      const id = store.startRun({});
      store.endRun();
      store.selectRun(id);
      store.deselectRun(id);

      expect(useRunStore.getState().selectedRunIds).not.toContain(id);
    });
  });

  describe('renameRun', () => {
    it('updates run name', () => {
      const store = useRunStore.getState();
      const id = store.startRun({});
      store.renameRun(id, 'My Best Run');

      expect(useRunStore.getState().runs.find((r) => r.id === id)?.name).toBe('My Best Run');
    });
  });

  describe('deleteRun', () => {
    it('removes run and deselects it', () => {
      const store = useRunStore.getState();
      const id = store.startRun({});
      store.endRun();
      store.selectRun(id);
      store.deleteRun(id);

      const state = useRunStore.getState();
      expect(state.runs).toHaveLength(0);
      expect(state.selectedRunIds).not.toContain(id);
    });
  });

  describe('exportRun', () => {
    it('returns JSON string for existing run', () => {
      const store = useRunStore.getState();
      const id = store.startRun({ lr: 0.01 });
      store.recordEpisode({ reward: 3, epsilon: 0.9, steps: 10 });
      store.endRun();

      const json = store.exportRun(id);
      expect(json).not.toBeNull();
      const parsed = JSON.parse(json!);
      expect(parsed.config).toEqual({ lr: 0.01 });
      expect(parsed.episodes).toHaveLength(1);
    });

    it('returns null for non-existent run', () => {
      expect(useRunStore.getState().exportRun('nope')).toBeNull();
    });
  });

  describe('persistence round-trip', () => {
    it('state can be serialized and restored without data loss', () => {
      const store = useRunStore.getState();
      const id = store.startRun({ lr: 0.005, hiddenLayers: [32, 64] });
      store.recordEpisode({ reward: 10, epsilon: 0.8, steps: 50 });
      store.recordEpisode({ reward: 15, epsilon: 0.7, steps: 40 });
      store.endRun();

      // Snapshot the state
      const snapshot = useRunStore.getState();
      const serialized = JSON.stringify({ runs: snapshot.runs });

      // Reset
      useRunStore.setState({ runs: [], selectedRunIds: [], activeRunId: null });
      expect(useRunStore.getState().runs).toHaveLength(0);

      // Restore
      const parsed = JSON.parse(serialized);
      useRunStore.setState({ runs: parsed.runs });

      const restored = useRunStore.getState();
      expect(restored.runs).toHaveLength(1);
      expect(restored.runs[0].id).toBe(id);
      expect(restored.runs[0].config).toEqual({ lr: 0.005, hiddenLayers: [32, 64] });
      expect(restored.runs[0].episodes).toHaveLength(2);
      expect(restored.runs[0].episodes[1].reward).toBe(15);
      expect(restored.runs[0].endedAt).not.toBeNull();
    });
  });

  describe('clearAll', () => {
    it('removes all runs and selections', () => {
      const store = useRunStore.getState();
      store.startRun({});
      store.endRun();
      store.startRun({});
      store.endRun();
      store.clearAll();

      const state = useRunStore.getState();
      expect(state.runs).toHaveLength(0);
      expect(state.selectedRunIds).toHaveLength(0);
      expect(state.activeRunId).toBeNull();
    });
  });
});
