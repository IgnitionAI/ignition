import { useRef, useCallback } from 'react';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CircuitEnv } from './circuit-env';
import { Scene3D } from './Scene3D';
import { RewardChart } from './RewardChart';
import { CodePanel } from './CodePanel';
import { Controls } from './Controls';
import { useDemoStore } from './store';

export default function App() {
  const envRef = useRef<IgnitionEnvTFJS | null>(null);
  const circuitRef = useRef<CircuitEnv>(new CircuitEnv());
  const episodeRewardRef = useRef(0);
  const origStepRef = useRef<typeof CircuitEnv.prototype.step | null>(null);
  const origResetRef = useRef<typeof CircuitEnv.prototype.reset | null>(null);

  const { setMode, updateCar, recordEpisode, resetStats } = useDemoStore();

  const syncState = useCallback(() => {
    const c = circuitRef.current;
    updateCar({ carX: c.carX, carY: c.carY, carAngle: c.carAngle, stepCount: c.stepCount, laps: c.laps });
  }, [updateCar]);

  const createEnv = useCallback(() => {
    const circuit = circuitRef.current;
    if (!origStepRef.current) {
      origStepRef.current = circuit.step.bind(circuit);
      origResetRef.current = circuit.reset.bind(circuit);
      circuit.step = (action: number | number[]) => {
        origStepRef.current!(action);
        episodeRewardRef.current += circuit.reward();
        syncState();
      };
      circuit.reset = () => {
        recordEpisode(episodeRewardRef.current);
        episodeRewardRef.current = 0;
        origResetRef.current!();
        syncState();
      };
    }
    const env = new IgnitionEnvTFJS(circuit);
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

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', padding: '20px 0 4px' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Ignition<span style={{ color: '#6366f1' }}>AI</span> — Car Circuit
        </h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
          Train RL agents in the browser. Deploy anywhere.
        </p>
      </header>

      {/* 3D Scene — hero area */}
      <div style={{ height: '50vh', minHeight: 350, maxHeight: 500, margin: '0 auto', maxWidth: 1000 }}>
        <Scene3D />
      </div>

      {/* Controls */}
      <Controls
        onStart={handleStart} onStop={handleStop} onReset={handleReset} onInfer={handleInfer}
        onSpeedChange={(m) => { if (envRef.current) envRef.current.setSpeed(m); }}
      />

      {/* Bottom: code + chart */}
      <div style={{ display: 'flex', gap: 24, padding: '8px 32px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ flex: '0 0 380px' }}>
          <CodePanel />
        </div>
        <div style={{ flex: 1, minWidth: 250 }}>
          <RewardChart />
        </div>
      </div>
    </div>
  );
}
