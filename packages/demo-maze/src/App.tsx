import { useCallback, useRef } from 'react';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { Scene3D } from './Scene3D';
import { Controls } from './Controls';
import { CodePanel } from './CodePanel';
import { RewardChart } from './RewardChart';
import { MazeEnv } from './maze-env';
import { useDemoStore } from './store';

export default function App() {
  const envRef = useRef<IgnitionEnvTFJS | null>(null);
  const mazeRef = useRef<MazeEnv>(new MazeEnv());
  const episodeRewardRef = useRef(0);
  const origStepRef = useRef<typeof MazeEnv.prototype.step | null>(null);
  const origResetRef = useRef<typeof MazeEnv.prototype.reset | null>(null);

  const { setMode, updateMaze, recordEpisode, resetStats, incrementStep } = useDemoStore();

  const syncMaze = useCallback(() => {
    updateMaze(mazeRef.current.snapshot());
  }, [updateMaze]);

  const createEnv = useCallback(() => {
    const maze = mazeRef.current;
    if (!origStepRef.current) {
      origStepRef.current = maze.step.bind(maze);
      origResetRef.current = maze.reset.bind(maze);
      maze.step = (action: number | number[]) => {
        origStepRef.current!(action);
        episodeRewardRef.current += maze.reward();
        incrementStep();
        syncMaze();
      };
      maze.reset = () => {
        recordEpisode(episodeRewardRef.current);
        episodeRewardRef.current = 0;
        origResetRef.current!();
        syncMaze();
      };
    }

    const env = new IgnitionEnvTFJS(maze);
    env.setSpeed(16);
    envRef.current = env;
    syncMaze();
    return env;
  }, [incrementStep, recordEpisode, syncMaze]);

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
    syncMaze();
  }, [resetStats, setMode, syncMaze]);

  return (
    <div style={{ minHeight: '100vh', background: '#070910', color: '#e5e7eb', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #1f2937' }}>
        <a
          href="/"
          style={{
            position: 'absolute',
            left: 24,
            color: '#9ca3af',
            fontSize: 13,
            textDecoration: 'none',
            padding: '7px 12px',
            border: '1px solid #374151',
            borderRadius: 8,
            background: '#0f172a',
          }}
          aria-label="Back to IgnitionAI landing page"
        >
          ← IgnitionAI
        </a>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
          Ignition<span style={{ color: '#818cf8' }}>AI</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af', marginLeft: 12 }}>Maze 3D</span>
        </h1>
      </header>

      <main>
        <div style={{ height: '60vh', minHeight: 460, width: '100%' }}>
          <Scene3D />
        </div>
        <Controls onStart={handleStart} onStop={handleStop} onReset={handleReset} onInfer={handleInfer} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 430px) minmax(280px, 1fr)', gap: 24, maxWidth: 1120, margin: '0 auto', padding: '22px 28px 30px' }}>
          <CodePanel />
          <RewardChart />
        </div>
      </main>
    </div>
  );
}
