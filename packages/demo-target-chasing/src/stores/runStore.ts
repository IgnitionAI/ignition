import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrainingRun, RunMetrics } from '../types/runs';

const MAX_RUNS = 100;
const MAX_EPISODES_PER_RUN = 2000;

interface RunStore {
  runs: TrainingRun[];
  selectedRunIds: string[];
  activeRunId: string | null;

  startRun: (config: Record<string, unknown>) => string;
  recordEpisode: (metrics: Omit<RunMetrics, 'episode'>) => void;
  endRun: () => void;
  selectRun: (id: string) => void;
  deselectRun: (id: string) => void;
  renameRun: (id: string, name: string) => void;
  deleteRun: (id: string) => void;
  exportRun: (id: string) => string | null;
  clearAll: () => void;
}

export const useRunStore = create<RunStore>()(
  persist(
    (set, get) => ({
      runs: [],
      selectedRunIds: [],
      activeRunId: null,

      startRun: (config) => {
        const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const run: TrainingRun = {
          id,
          name: `Run ${get().runs.length + 1}`,
          config,
          episodes: [],
          startedAt: new Date().toISOString(),
          endedAt: null,
        };
        set((state) => {
          let runs = [run, ...state.runs];
          // Auto-prune oldest runs beyond MAX_RUNS
          if (runs.length > MAX_RUNS) {
            runs = runs.slice(0, MAX_RUNS);
          }
          return { runs, activeRunId: id };
        });
        return id;
      },

      recordEpisode: (metrics) => {
        const { activeRunId } = get();
        if (!activeRunId) return;
        set((state) => ({
          runs: state.runs.map((r) => {
            if (r.id !== activeRunId) return r;
            if (r.episodes.length >= MAX_EPISODES_PER_RUN) return r;
            return {
              ...r,
              episodes: [
                ...r.episodes,
                { ...metrics, episode: r.episodes.length + 1 },
              ],
            };
          }),
        }));
      },

      endRun: () => {
        const { activeRunId } = get();
        if (!activeRunId) return;
        set((state) => ({
          activeRunId: null,
          runs: state.runs.map((r) =>
            r.id === activeRunId ? { ...r, endedAt: new Date().toISOString() } : r
          ),
        }));
      },

      selectRun: (id) => {
        set((state) => {
          if (state.selectedRunIds.includes(id)) return state;
          if (state.selectedRunIds.length >= 5) return state;
          return { selectedRunIds: [...state.selectedRunIds, id] };
        });
      },

      deselectRun: (id) => {
        set((state) => ({
          selectedRunIds: state.selectedRunIds.filter((rid) => rid !== id),
        }));
      },

      renameRun: (id, name) => {
        set((state) => ({
          runs: state.runs.map((r) => (r.id === id ? { ...r, name } : r)),
        }));
      },

      deleteRun: (id) => {
        set((state) => ({
          runs: state.runs.filter((r) => r.id !== id),
          selectedRunIds: state.selectedRunIds.filter((rid) => rid !== id),
          activeRunId: state.activeRunId === id ? null : state.activeRunId,
        }));
      },

      exportRun: (id) => {
        const run = get().runs.find((r) => r.id === id);
        if (!run) return null;
        return JSON.stringify(run, null, 2);
      },

      clearAll: () => {
        set({ runs: [], selectedRunIds: [], activeRunId: null });
      },
    }),
    {
      name: 'ignitionai-training-runs',
      partialize: (state) => ({
        runs: state.runs,
      }),
      storage: {
        getItem: (name) => {
          try {
            const raw = localStorage.getItem(name);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // Quota exceeded — prune oldest 10 runs and retry
            const state = useRunStore.getState();
            if (state.runs.length > 10) {
              useRunStore.setState({ runs: state.runs.slice(0, state.runs.length - 10) });
              try {
                localStorage.setItem(name, JSON.stringify(value));
              } catch {
                // Still failing — disable persistence silently
                console.warn('[IgnitionAI] localStorage full — run persistence disabled');
              }
            }
          }
        },
        removeItem: (name) => {
          try { localStorage.removeItem(name); } catch { /* ignore */ }
        },
      },
    }
  )
);
