import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PPOAgent } from '@ignitionai/backend-tfjs';
import {
  fetchJson,
  formatPpoReturn,
  parseEpisodeReturns,
  type PpoManifest,
  type PpoSeedSummary,
} from './artifacts';
import { httpModelProvider } from './http-provider';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b'];
const TARGET = 0.75;

function nav1dStep(pos: number, action: number): { newPos: number; reward: number; done: boolean } {
  const delta = action === 1 ? 0.15 : -0.15;
  const newPos = Math.max(0, Math.min(1, pos + delta));
  const done = newPos > 0.7;
  return { newPos, reward: done ? 1.0 : -0.05, done };
}

function xOf(pos: number): number {
  return pos * 6 - 3;
}

function Scene({ position }: { position: number }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 4]} intensity={1.1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#1e2937" />
      </mesh>
      <mesh position={[xOf(position), 0, 0]} castShadow>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[xOf(TARGET), 0, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </>
  );
}

export default function PpoReplayApp() {
  const [manifest, setManifest] = useState<PpoManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<'untrained' | 'trained'>('untrained');
  const [seed, setSeed] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<PpoSeedSummary[]>([]);
  const [position, setPosition] = useState(0.2);
  const [episodeReturn, setEpisodeReturn] = useState(0);
  const [status, setStatus] = useState('idle');
  const [curves, setCurves] = useState<Record<string, number>[]>([]);
  const agentRef = useRef<PPOAgent | null>(null);
  const running = useRef(false);

  const manifestUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('manifest') ?? '/ppo/manifest.json';
  }, []);

  const loadPolicy = useCallback(async (kind: 'untrained' | 'trained', nextSeed: number) => {
    agentRef.current?.dispose?.();
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [32, 32],
      storageProvider: httpModelProvider('/ppo'),
    });
    await agent.load(`seed-${nextSeed}/${kind}`);
    agentRef.current = agent;
    setSeed(nextSeed);
    setPolicy(kind);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchJson<PpoManifest>(manifestUrl);
        const series: number[][] = [];
        for (const seed of data.seeds) {
          const returns = parseEpisodeReturns(
            await fetchJson<unknown>(`/ppo/seed-${seed}/episodes.json`),
          );
          series.push(returns);
        }
        const maxLen = Math.max(...series.map((row) => row.length), 0);
        const chart: Record<string, number>[] = [];
        for (let i = 0; i < maxLen; i++) {
          const row: Record<string, number> = { episode: i + 1 };
          data.seeds.forEach((seed, index) => {
            if (i < series[index].length) row[`seed ${seed}`] = series[index][i];
          });
          chart.push(row);
        }
        const loadedSummaries: PpoSeedSummary[] = [];
        for (const seedId of data.seeds) {
          loadedSummaries.push(await fetchJson<PpoSeedSummary>(`/ppo/seed-${seedId}/summary.json`));
        }
        if (cancelled) return;
        setCurves(chart);
        setSummaries(loadedSummaries);
        setManifest(data);
        await loadPolicy('untrained', data.selectedSeed);
        setStatus('loaded');
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();
    return () => {
      cancelled = true;
      running.current = false;
      agentRef.current?.dispose?.();
    };
  }, [loadPolicy, manifestUrl]);

  const replay = async () => {
    const agent = agentRef.current;
    if (!agent || running.current) return;
    running.current = true;
    setStatus(`replay-${policy}`);
    let pos = 0.2;
    let total = 0;
    setPosition(pos);
    setEpisodeReturn(0);
    for (let step = 0; step < 25; step++) {
      if (!running.current) break;
      const action = await agent.getAction([pos], true);
      const { newPos, reward, done } = nav1dStep(pos, action as number);
      total += reward;
      pos = newPos;
      setPosition(pos);
      setEpisodeReturn(total);
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (done) break;
    }
    running.current = false;
    setStatus('idle');
  };

  if (error) {
    return (
      <div data-testid="ppo-error" style={page}>
        <h1>PPO before / after</h1>
        <p role="alert">{error}</p>
        <p>No simulated success. Place checkpoints and logs under public/ppo then reload.</p>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div data-testid="ppo-loading" style={page}>
        Loading PPO artifacts…
      </div>
    );
  }

  const activeSummary = summaries.find((row) => row.seed === seed);

  return (
    <div style={page}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>PPO before / after</h1>
          <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>
            Seed {seed} · SHA {manifest.gitSha.slice(0, 12)} · greedy means from loaded summary.json
          </p>
        </div>
        <a href="/" style={{ color: '#a5b4fc' }}>Live DQN 3D</a>
      </header>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {manifest.seeds.map((seedId) => (
          <button
            key={seedId}
            data-testid={`ppo-seed-${seedId}`}
            onClick={() => void loadPolicy(policy, seedId)}
            style={seed === seedId ? activeBtn : btn}
          >
            Seed {seedId}
          </button>
        ))}
        <button
          data-testid="ppo-untrained"
          onClick={() => seed !== null && void loadPolicy('untrained', seed)}
          style={policy === 'untrained' ? activeBtn : btn}
        >
          Replay untrained
        </button>
        <button
          data-testid="ppo-trained"
          onClick={() => seed !== null && void loadPolicy('trained', seed)}
          style={policy === 'trained' ? activeBtn : btn}
        >
          Replay trained checkpoint
        </button>
        <button data-testid="ppo-play" onClick={() => void replay()} style={btn}>
          Play greedy episode
        </button>
      </div>

      <p data-testid="ppo-greedy-from-file">
        Loaded greedy eval (same 20 starts): untrained {formatPpoReturn(activeSummary?.untrainedGreedyEvalMean)} ·
        trained {formatPpoReturn(activeSummary?.greedyEvalMean)} · gap {formatPpoReturn(activeSummary?.greedyGap)}
        <br />
        Greedy episode from 0.2 (file): untrained {formatPpoReturn(activeSummary?.untrainedGreedyReturnAt02)} ·
        trained {formatPpoReturn(activeSummary?.trainedGreedyReturnAt02)}
      </p>

      <p data-testid="ppo-policy">
        Active policy: <strong>{policy}</strong> · checkpoint seed-{seed}/{policy} ·
        status {status} · live replay return {episodeReturn.toFixed(3)}
      </p>

      <div data-testid="ppo-canvas" style={{ height: 280, border: '1px solid #334155', borderRadius: 8, overflow: 'hidden' }}>
        <Canvas shadows camera={{ position: [0, 3.2, 7], fov: 45 }}>
          <Scene position={position} />
        </Canvas>
      </div>

      <div data-testid="ppo-chart" style={{ height: 320, marginTop: 16 }}>
        <h2 style={{ fontSize: 16 }}>Episode return from loaded JSON logs</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={curves}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="episode" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
            <Legend />
            {manifest.seeds.map((seed, index) => (
              <Line
                key={seed}
                type="monotone"
                dataKey={`seed ${seed}`}
                stroke={COLORS[index % COLORS.length]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul data-testid="ppo-seed-results">
        {summaries.map((row) => (
          <li key={row.seed}>
            seed {row.seed}: first20={formatPpoReturn(row.firstMean20)} last20={formatPpoReturn(row.lastMean20)}{' '}
            greedy untrained={formatPpoReturn(row.untrainedGreedyEvalMean)} trained={formatPpoReturn(row.greedyEvalMean)}{' '}
            gap={formatPpoReturn(row.greedyGap)}{' '}
            {row.improved ? 'improved (train curve)' : 'did not improve (train curve)'}
          </li>
        ))}
      </ul>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: '100vh',
  margin: 0,
  padding: 20,
  background: '#0a0a1a',
  color: '#e2e8f0',
  fontFamily: 'system-ui, sans-serif',
};

const btn: CSSProperties = {
  padding: '8px 12px',
  background: 'transparent',
  color: '#e2e8f0',
  border: '1px solid #64748b',
  borderRadius: 6,
  cursor: 'pointer',
};

const activeBtn: CSSProperties = {
  ...btn,
  background: '#4f46e5',
  borderColor: '#4f46e5',
};
