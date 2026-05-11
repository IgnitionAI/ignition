import { useState, useRef, useCallback, useEffect } from 'react'
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs'
import { Maze3DEnv } from './maze-env'
import { useMazeStore } from './store'
import Maze3D from './Maze3D'

export default function App() {
  const [isTraining, setIsTraining] = useState(false)
  const [episodes, setEpisodes] = useState(0)
  const [totalReward, setTotalReward] = useState(0)
  const [stepCount, setStepCount] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [algorithm, setAlgorithm] = useState<'dqn' | 'qtable'>('dqn')

  const envRef = useRef<Maze3DEnv | null>(null)
  const ignitionRef = useRef<IgnitionEnvTFJS | null>(null)
  const rafRef = useRef<number>(0)
  const isRunningRef = useRef(false)

  const startTraining = useCallback(async () => {
    if (isRunningRef.current) return

    const maze = new Maze3DEnv()
    envRef.current = maze
    const ignition = new IgnitionEnvTFJS(maze)
    ignitionRef.current = ignition
    ignition.train(algorithm)
    ignition.setSpeed(speed)

    setIsTraining(true)
    isRunningRef.current = true

    let episodeCounter = 0
    let lastDone = false
    let lastSteps = 0
    let episodeReward = 0

    const loop = () => {
      if (!isRunningRef.current || !envRef.current) return

      const maze = envRef.current
      const steps = maze.getStepCount()
      const done = maze.done()

      if (steps !== lastSteps) {
        lastSteps = steps
        episodeReward += maze.reward()
        setStepCount(steps)
        useMazeStore.getState().setAgentState(
          maze.getPosition(),
          maze.getAngle(),
          maze.getHasKey()
        )
      }

      if (done && !lastDone) {
        lastDone = true
        episodeCounter++
        setEpisodes(episodeCounter)
        setTotalReward((prev) => prev + episodeReward)
        episodeReward = 0
      }
      if (!done) {
        lastDone = false
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [algorithm, speed])

  const stopTraining = useCallback(() => {
    isRunningRef.current = false
    cancelAnimationFrame(rafRef.current)
    ignitionRef.current?.stop?.()
    ignitionRef.current?.agent?.dispose?.()
    ignitionRef.current = null
    envRef.current = null
    setIsTraining(false)
  }, [])

  const resetEnv = useCallback(() => {
    stopTraining()
    setEpisodes(0)
    setTotalReward(0)
    setStepCount(0)
    const maze = new Maze3DEnv()
    useMazeStore.getState().setAgentState(maze.getPosition(), maze.getAngle(), false)
  }, [stopTraining])

  useEffect(() => {
    return () => stopTraining()
  }, [stopTraining])

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-200 font-sans">
      {/* 3D Viewport */}
      <div className="absolute inset-0">
        <Maze3D />
      </div>

      {/* Overlay UI */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl p-4 min-w-[240px]">
          <h1 className="text-lg font-bold text-indigo-400 mb-1">Maze 3D</h1>
          <p className="text-xs text-slate-500 mb-4">Train an agent to escape the maze</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Algorithm</span>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'dqn' | 'qtable')}
                disabled={isTraining}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm disabled:opacity-50"
              >
                <option value="dqn">DQN</option>
                <option value="qtable">Q-Table</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Speed</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={speed}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setSpeed(v)
                    ignitionRef.current?.setSpeed?.(v)
                  }}
                  className="w-20 accent-indigo-500"
                />
                <span className="text-xs text-slate-500 w-6">{speed}x</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {!isTraining ? (
                <button
                  onClick={startTraining}
                  className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Train
                </button>
              ) : (
                <button
                  onClick={stopTraining}
                  className="flex-1 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Stop
                </button>
              )}
              <button
                onClick={resetEnv}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Episodes</span>
              <span className="font-mono">{episodes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total reward</span>
              <span className="font-mono">{totalReward.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Steps</span>
              <span className="font-mono">{stepCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Key</span>
              <span className="font-mono">{useMazeStore((s) => s.hasKey) ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-400">Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">Key</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-slate-400">Locked door</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">Trap</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-400">Exit</span>
          </div>
        </div>
      </div>
    </div>
  )
}
