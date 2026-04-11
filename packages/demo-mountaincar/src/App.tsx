import { useRef, useCallback } from 'react';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { MountainCarEnv } from './mountaincar-env';
import { MountainCarCanvas } from './MountainCarCanvas';
import { RewardChart } from './RewardChart';
import { CodePanel } from './CodePanel';
import { Controls } from './Controls';
import { useDemoStore } from './store';

export default function App() {
  const envRef = useRef<IgnitionEnvTFJS | null>(null);
  const carRef = useRef<MountainCarEnv>(new MountainCarEnv());
  const episodeRewardRef = useRef(0);

  const { setTraining, updatePhysics, recordEpisode, resetStats } = useDemoStore();

  const syncState = useCallback(() => {
    const c = carRef.current;
    updatePhysics(c.position, c.velocity, c.stepCount);
  }, [updatePhysics]);

  const createEnv = useCallback(() => {
    const car = carRef.current;
    const env = new IgnitionEnvTFJS({
      getObservation: () => car.observe(),
      actions: ['push_left', 'none', 'push_right'],
      applyAction: (action) => {
        car.step(action);
        episodeRewardRef.current += car.reward();
        syncState();
      },
      computeReward: () => car.reward(),
      isTerminated: () => car.done(),
      onReset: () => {
        recordEpisode(episodeRewardRef.current);
        episodeRewardRef.current = 0;
        car.reset();
        syncState();
      },
      stepIntervalMs: 20,
    });
    envRef.current = env;
    syncState();
    return env;
  }, [syncState, recordEpisode]);

  const handleStart = useCallback(() => {
    if (!envRef.current) createEnv();
    envRef.current!.train(useDemoStore.getState().algorithm);
    setTraining(true);
  }, [createEnv, setTraining]);

  const handleStop = useCallback(() => {
    envRef.current?.stop();
    setTraining(false);
  }, [setTraining]);

  const handleReset = useCallback(() => {
    envRef.current?.stop();
    envRef.current?.agent?.dispose?.();
    envRef.current = null;
    carRef.current.reset();
    episodeRewardRef.current = 0;
    resetStats();
    setTraining(false);
    syncState();
  }, [resetStats, setTraining, syncState]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Ignition<span style={{ color: '#6366f1' }}>AI</span> — MountainCar
        </h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
          Build momentum. Reach the flag. Discover the counterintuitive strategy.
        </p>
      </header>
      <div style={{ display: 'flex', gap: 24, padding: '16px 32px', maxWidth: 1200, margin: '0 auto', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 380px' }}><CodePanel /></div>
        <div style={{ flex: '0 0 auto' }}><MountainCarCanvas /></div>
        <div style={{ flex: 1, minWidth: 280 }}><RewardChart /></div>
      </div>
      <Controls onStart={handleStart} onStop={handleStop} onReset={handleReset} />
    </div>
  );
}
