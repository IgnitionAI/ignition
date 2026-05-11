'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface Episode {
  episode: number
  reward: number
  steps: number
}

function generateEpisodeReward(episode: number, algo: 'dqn' | 'ppo'): number {
  // Simulate RL learning curve: noisy exponential rise to plateau
  const noise = (Math.random() - 0.5) * 40
  const plateau = algo === 'dqn' ? 195 : 190
  const rise = plateau * (1 - Math.exp(-episode / 30))
  return Math.max(10, Math.min(plateau, rise + noise + 20))
}

export default function Playground() {
  const [isTraining, setIsTraining] = useState(false)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [status, setStatus] = useState('Ready')
  const [speed, setSpeed] = useState(1)
  const [algorithm, setAlgorithm] = useState<'dqn' | 'ppo'>('dqn')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const episodeRef = useRef(0)

  const tick = useCallback(() => {
    episodeRef.current += 1
    const ep = episodeRef.current
    const reward = generateEpisodeReward(ep, algorithm)
    const steps = Math.round(reward * 1.5 + Math.random() * 50)
    setEpisodes(prev => [...prev, { episode: ep, reward, steps }])
  }, [algorithm])

  const startTraining = useCallback(() => {
    if (isTraining) return
    setIsTraining(true)
    setEpisodes([])
    episodeRef.current = 0
    setStatus('Training...')

    const intervalMs = Math.max(50, 1000 / speed)
    intervalRef.current = setInterval(tick, intervalMs)
  }, [isTraining, speed, tick])

  const stopTraining = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsTraining(false)
    setStatus('Stopped')
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Update interval when speed changes during training
  useEffect(() => {
    if (isTraining && intervalRef.current) {
      clearInterval(intervalRef.current)
      const intervalMs = Math.max(50, 1000 / speed)
      intervalRef.current = setInterval(tick, intervalMs)
    }
  }, [speed, isTraining, tick])

  // Chart math
  const maxEpisodes = Math.max(50, episodes.length)
  const maxReward = Math.max(200, ...episodes.map(e => e.reward))
  const points = episodes.map((e, i) => {
    const x = (i / (maxEpisodes - 1)) * 100
    const y = 100 - (e.reward / maxReward) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <section id="playground" className="relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20 border-t border-slate-800">

          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
            <div className="inline-flex font-medium bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-indigo-200 pb-3">
              Interactive Playground
            </div>
            <h2 className="h2 bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-4">
              Train an agent in your browser
            </h2>
            <p className="text-lg text-slate-400">
              Pick an algorithm, hit Train, and watch the reward climb in real time. This is a simulation — open a live demo below to run real RL.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 md:p-8">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Algorithm</label>
                <select
                  value={algorithm}
                  onChange={e => setAlgorithm(e.target.value as 'dqn' | 'ppo')}
                  disabled={isTraining}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 disabled:opacity-50"
                >
                  <option value="dqn">DQN</option>
                  <option value="ppo">PPO</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Speed</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={speed}
                  onChange={e => setSpeed(Number(e.target.value))}
                  className="w-24 accent-indigo-500"
                />
                <span className="text-xs text-slate-500 w-8">{speed}x</span>
              </div>

              <div className="flex-1" />

              {!isTraining ? (
                <button
                  onClick={startTraining}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Train
                </button>
              ) : (
                <button
                  onClick={stopTraining}
                  className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Stop
                </button>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${isTraining ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-sm text-slate-400">{status}</span>
              <span className="text-xs text-slate-500 ml-2">
                {episodes.length > 0 ? `${episodes.length} episodes` : ''}
              </span>
            </div>

            {/* Reward Chart */}
            <div className="relative h-64 bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
              {episodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm">
                  Click Train to start
                </div>
              ) : (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  {[0, 25, 50, 75, 100].map(y => (
                    <line key={y} x1={0} y1={y} x2={100} y2={y} stroke="#1e293b" strokeWidth={0.5} />
                  ))}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={0.5}
                    points={points}
                  />
                  <polygon
                    fill="url(#grad)"
                    opacity={0.2}
                    points={`0,100 ${points} 100,100`}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              )}

              <div className="absolute bottom-2 left-2 text-[10px] text-slate-600">Episode 0</div>
              <div className="absolute bottom-2 right-2 text-[10px] text-slate-600">
                Episode {maxEpisodes}
              </div>
              <div className="absolute top-2 left-2 text-[10px] text-slate-600">
                Reward {Math.round(maxReward)}
              </div>
            </div>

            {/* Stats */}
            {episodes.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-slate-200">{episodes.length}</div>
                  <div className="text-xs text-slate-500">Episodes</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-indigo-400">
                    {episodes[episodes.length - 1].reward.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Latest reward</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-emerald-400">
                    {Math.max(...episodes.map(e => e.reward)).toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Best reward</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
