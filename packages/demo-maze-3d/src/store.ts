import { create } from 'zustand'

interface MazeStore {
  episode: number
  totalReward: number
  stepCount: number
  isTraining: boolean
  agentPos: { x: number; z: number }
  agentAngle: number
  hasKey: boolean
  grid: number[][] | null
  setEpisode: (n: number) => void
  setTotalReward: (r: number) => void
  setStepCount: (s: number) => void
  setIsTraining: (v: boolean) => void
  setAgentState: (pos: { x: number; z: number }, angle: number, hasKey: boolean) => void
  setGrid: (g: number[][]) => void
}

export const useMazeStore = create<MazeStore>((set) => ({
  episode: 0,
  totalReward: 0,
  stepCount: 0,
  isTraining: false,
  agentPos: { x: 1, z: 1 },
  agentAngle: 0,
  hasKey: false,
  grid: null,
  setEpisode: (n) => set({ episode: n }),
  setTotalReward: (r) => set({ totalReward: r }),
  setStepCount: (s) => set({ stepCount: s }),
  setIsTraining: (v) => set({ isTraining: v }),
  setAgentState: (pos, angle, hasKey) => set({ agentPos: pos, agentAngle: angle, hasKey }),
  setGrid: (g) => set({ grid: g }),
}))
