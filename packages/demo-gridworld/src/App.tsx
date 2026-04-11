import { useRef, useCallback } from 'react';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { GridWorldEnv } from './gridworld-env';
import { GridCanvas } from './GridCanvas';
import { RewardChart } from './RewardChart';
import { CodePanel } from './CodePanel';
import { Controls } from './Controls';
import { useDemoStore } from './store';

export default function App() {
  const envRef = useRef<IgnitionEnvTFJS | null>(null);
  const gridRef = useRef<GridWorldEnv>(new GridWorldEnv(7));
  const episodeRewardRef = useRef(0);

  const { algorithm, setTraining, updateGrid, recordEpisode, resetStats, incrementStep } = useDemoStore();

  const syncGrid = useCallback(() => {
    const g = gridRef.current;
    updateGrid({
      agentRow: g.agentRow,
      agentCol: g.agentCol,
      targetRow: g.targetRow,
      targetCol: g.targetCol,
      trail: [...g.trail],
      gridSize: g.gridSize,
    });
  }, [updateGrid]);

  const createEnv = useCallback(() => {
    const grid = gridRef.current;

    const env = new IgnitionEnvTFJS({
      getObservation: () => grid.observe(),
      actions: ['up', 'right', 'down', 'left'],
      applyAction: (action) => {
        grid.step(action);
        episodeRewardRef.current += grid.reward();
        incrementStep();
        syncGrid();
      },
      computeReward: () => grid.reward(),
      isTerminated: () => grid.done(),
      onReset: () => {
        recordEpisode(episodeRewardRef.current);
        episodeRewardRef.current = 0;
        grid.reset();
        syncGrid();
      },
      stepIntervalMs: 50,
    });

    envRef.current = env;
    syncGrid();
    return env;
  }, [syncGrid, recordEpisode, incrementStep]);

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
    gridRef.current.reset();
    resetStats();
    setTraining(false);
    syncGrid();
  }, [resetStats, setTraining, syncGrid]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Ignition<span style={{ color: '#6366f1' }}>AI</span>
        </h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
          Train RL agents in the browser. Zero config.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 24, padding: '16px 32px', maxWidth: 1200, margin: '0 auto', alignItems: 'flex-start' }}>
        {/* Left: Code */}
        <div style={{ flex: '0 0 380px' }}>
          <CodePanel />
        </div>

        {/* Center: Grid */}
        <div style={{ flex: '0 0 auto' }}>
          <GridCanvas />
        </div>

        {/* Right: Chart */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <RewardChart />
        </div>
      </div>

      <Controls onStart={handleStart} onStop={handleStop} onReset={handleReset} />
    </div>
  );
}
