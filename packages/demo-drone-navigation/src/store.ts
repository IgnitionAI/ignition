import { create } from 'zustand'

type Mode = 'stopped' | 'training' | 'inference'

interface DemoState {
  mode: Mode
  episode: number
  totalSteps: number
  captures: number
  lastReward: number
  rewardHistory: { step: number; reward: number }[]

  setMode: (mode: Mode) => void
  incrementEpisode: () => void
  setStats: (stats: { totalSteps: number; captures: number; lastReward: number }) => void
  pushReward: (step: number, reward: number) => void
  reset: () => void
}

export const useDemoStore = create<DemoState>((set) => ({
  mode: 'stopped',
  episode: 0,
  totalSteps: 0,
  captures: 0,
  lastReward: 0,
  rewardHistory: [],

  setMode: (mode) => set({ mode }),
  incrementEpisode: () => set((s) => ({ episode: s.episode + 1 })),
  setStats: (stats) => set(stats),
  pushReward: (step, reward) =>
    set((s) => {
      const next = [...s.rewardHistory, { step, reward }]
      if (next.length > 200) next.shift()
      return { rewardHistory: next }
    }),
  reset: () =>
    set({
      mode: 'stopped',
      episode: 0,
      totalSteps: 0,
      captures: 0,
      lastReward: 0,
      rewardHistory: [],
    }),
}))
