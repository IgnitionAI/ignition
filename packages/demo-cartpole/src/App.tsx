import { useRef, useCallback } from 'react';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from './cartpole-env';
import { CartPoleCanvas } from './CartPoleCanvas';
import { RewardChart } from './RewardChart';
import { CodePanel } from './CodePanel';
import { Controls } from './Controls';
import { useDemoStore } from './store';

export default function App() {
  const envRef = useRef<IgnitionEnvTFJS | null>(null);
  const poleRef = useRef<CartPoleEnv>(new CartPoleEnv());
  const episodeStepsRef = useRef(0);

  const { setTraining, updateState, recordEpisode, resetStats } = useDemoStore();

  const syncState = useCallback(() => {
    updateState({ ...poleRef.current.state });
  }, [updateState]);

  const createEnv = useCallback(() => {
    const pole = poleRef.current;

    const env = new IgnitionEnvTFJS({
      getObservation: () => pole.observe(),
      actions: ['push_left', 'push_right'],
      applyAction: (action) => {
        pole.step(action);
        episodeStepsRef.current++;
        syncState();
      },
      computeReward: () => pole.reward(),
      isTerminated: () => pole.done(),
      onReset: () => {
        recordEpisode(episodeStepsRef.current);
        episodeStepsRef.current = 0;
        pole.reset();
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
    const algo = useDemoStore.getState().algorithm;
    envRef.current!.train(algo);
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
    poleRef.current.reset();
    episodeStepsRef.current = 0;
    resetStats();
    setTraining(false);
    syncState();
  }, [resetStats, setTraining, syncState]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Ignition<span style={{ color: '#6366f1' }}>AI</span> — CartPole
        </h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
          Balance the pole. Zero config. Watch it learn.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 24, padding: '16px 32px', maxWidth: 1200, margin: '0 auto', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 380px' }}>
          <CodePanel />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <CartPoleCanvas />
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <RewardChart />
        </div>
      </div>

      <Controls onStart={handleStart} onStop={handleStop} onReset={handleReset} />
    </div>
  );
}
