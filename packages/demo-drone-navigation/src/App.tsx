import { useCallback, useEffect, useRef } from 'react'
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs'
import { DroneEnv } from './drone-env'
import { Scene3D } from './Scene3D'
import { HUD } from './HUD'
import { Controls } from './Controls'
import { useDemoStore } from './store'

export default function App() {
  const envRef = useRef<DroneEnv>(new DroneEnv())
  const trainerRef = useRef<IgnitionEnvTFJS | null>(null)

  const setMode = useDemoStore((s) => s.setMode)
  const setStats = useDemoStore((s) => s.setStats)
  const incrementEpisode = useDemoStore((s) => s.incrementEpisode)
  const resetStore = useDemoStore((s) => s.reset)

  // Sync store stats from the env on a timer so React isn't reading
  // the mutable env state on every render.
  useEffect(() => {
    const id = setInterval(() => {
      const env = envRef.current
      setStats({
        totalSteps: trainerRef.current?.stepCount ?? 0,
        captures: env.captures,
        lastReward: env.reward(),
      })
    }, 200)
    return () => clearInterval(id)
  }, [setStats])

  // Wrap DroneEnv.reset so we can count episodes through the store
  useEffect(() => {
    const env = envRef.current
    const originalReset = env.reset.bind(env)
    env.reset = () => {
      originalReset()
      incrementEpisode()
    }
    return () => {
      env.reset = originalReset
    }
  }, [incrementEpisode])

  const startTrainer = useCallback(() => {
    if (!trainerRef.current) {
      trainerRef.current = new IgnitionEnvTFJS(envRef.current)
    }
    return trainerRef.current
  }, [])

  const handleTrain = useCallback(() => {
    const trainer = startTrainer()
    trainer.train('dqn')
    trainer.setSpeed(25)
    setMode('training')
  }, [setMode, startTrainer])

  const handleInfer = useCallback(() => {
    const trainer = trainerRef.current
    if (!trainer) {
      // No trained agent yet — kick off training first so the model exists
      handleTrain()
      return
    }
    trainer.infer()
    setMode('inference')
  }, [handleTrain, setMode])

  const handleReset = useCallback(() => {
    trainerRef.current?.stop()
    envRef.current.reset()
    resetStore()
  }, [resetStore])

  const handleSpeedChange = useCallback((speed: number) => {
    trainerRef.current?.setSpeed(speed)
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a1a',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          textAlign: 'center',
          padding: '16px 0 6px',
          position: 'relative',
        }}
      >
        <a
          href="/"
          style={{
            position: 'absolute',
            left: 24,
            top: 18,
            color: '#94a3b8',
            fontSize: 13,
            textDecoration: 'none',
            padding: '6px 12px',
            border: '1px solid #334155',
            borderRadius: 8,
            background: '#0f172a',
          }}
          aria-label="Back to IgnitionAI landing page"
        >
          ← IgnitionAI
        </a>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
          Ignition<span style={{ color: '#6366f1' }}>AI</span>
          <span style={{ fontSize: 14, fontWeight: 400, color: '#888', marginLeft: 12 }}>
            Drone Navigation
          </span>
        </h1>
        <p style={{ margin: '6px 0 0', color: '#888', fontSize: 13 }}>
          Rigid-body physics · 8 thrust combos · DQN learns to fly
        </p>
      </header>

      {/* 3D Scene — hero area with HUD overlay */}
      <div
        style={{
          position: 'relative',
          height: '60vh',
          minHeight: 420,
          maxHeight: 620,
          margin: '0 auto',
          maxWidth: 1100,
        }}
      >
        <Scene3D env={envRef.current} />
        <HUD />
      </div>

      <Controls
        onTrain={handleTrain}
        onInfer={handleInfer}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
      />

      <p
        style={{
          textAlign: 'center',
          color: '#64748b',
          fontSize: 12,
          padding: '8px 24px 24px',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        Press <strong>Train</strong> and wait ~3 minutes at 25× speed. The drone starts tumbling,
        then learns to hover, then chases the pulsing target. Each target captured earns a big
        reward and a new one spawns. Hitting the ground or flying out of the arena crashes the
        episode. Click <strong>Infer</strong> when it looks good to watch the trained policy play.
      </p>
    </div>
  )
}
