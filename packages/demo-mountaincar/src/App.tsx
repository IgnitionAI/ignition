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
  const origStepRef = useRef<typeof MountainCarEnv.prototype.step | null>(null);
  const origResetRef = useRef<typeof MountainCarEnv.prototype.reset | null>(null);

  const { mode, setMode, updatePhysics, recordEpisode, resetStats } = useDemoStore();

  const syncState = useCallback(() => {
    const c = carRef.current;
    updatePhysics(c.position, c.velocity, c.stepCount);
  }, [updatePhysics]);

  const createEnv = useCallback(() => {
    const car = carRef.current;

    if (!origStepRef.current) {
      origStepRef.current = car.step.bind(car);
      origResetRef.current = car.reset.bind(car);

      car.step = (action: number | number[]) => {
        origStepRef.current!(action);
        episodeRewardRef.current += car.reward();
        syncState();
      };

      car.reset = () => {
        recordEpisode(episodeRewardRef.current);
        episodeRewardRef.current = 0;
        origResetRef.current!();
        syncState();
      };
    }

    const env = new IgnitionEnvTFJS(car);
    envRef.current = env;
    syncState();
    return env;
  }, [syncState, recordEpisode]);

  const handleStart = useCallback(() => {
    if (!envRef.current) createEnv();
    envRef.current!.train(useDemoStore.getState().algorithm);
    setMode('training');
  }, [createEnv, setMode]);

  const handleInfer = useCallback(() => {
    if (!envRef.current?.agent) return;
    envRef.current.stop();
    envRef.current.infer();
    setMode('inference');
  }, [setMode]);

  const handleStop = useCallback(() => {
    envRef.current?.stop();
    setMode('stopped');
  }, [setMode]);

  const handleReset = useCallback(() => {
    envRef.current?.stop();
    envRef.current?.agent?.dispose?.();
    envRef.current = null;
    origResetRef.current?.();
    episodeRewardRef.current = 0;
    resetStats();
    setMode('stopped');
    syncState();
  }, [resetStats, setMode, syncState]);

  const borderColor = mode === 'training' ? '#22c55e' : mode === 'inference' ? '#3b82f6' : 'transparent';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ textAlign: 'center', padding: '24px 0 8px', position: 'relative' }}>
        <a
          href="/"
          style={{
            position: 'absolute', left: 24, top: 28,
            color: '#94a3b8', fontSize: 13, textDecoration: 'none',
            padding: '6px 12px', border: '1px solid #334155', borderRadius: 8,
            background: '#0f172a',
          }}
          aria-label="Back to IgnitionAI landing page"
        >
          ← IgnitionAI
        </a>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Ignition<span style={{ color: '#6366f1' }}>AI</span> — MountainCar</h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>Build momentum. Reach the flag. Discover the counterintuitive strategy.</p>
      </header>
      <div style={{ display: 'flex', gap: 24, padding: '16px 32px', maxWidth: 1200, margin: '0 auto', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 380px' }}><CodePanel /></div>
        <div style={{ flex: '0 0 auto', border: `3px solid ${borderColor}`, borderRadius: 10, padding: 2 }}><MountainCarCanvas /></div>
        <div style={{ flex: 1, minWidth: 280 }}><RewardChart /></div>
      </div>
      <Controls onStart={handleStart} onStop={handleStop} onReset={handleReset} onInfer={handleInfer} />
    </div>
  );
}
