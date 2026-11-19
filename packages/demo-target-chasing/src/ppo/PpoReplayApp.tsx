import { Canvas } from '@react-three/fiber';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
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
  formatPpoNumber,
  parseEpisodeReturns,
  ppoArtifactUrl,
  PpoArtifactMissingError,
  PpoLogFormatError,
  type PpoManifest,
  type PpoSeedSummary,
} from './artifacts';
import { httpModelProvider } from './http-provider';
import { getLanguage, setLanguage, subscribe, t, type Language } from '../i18n';

type Policy = 'untrained' | 'trained';
type Status = 'idle' | 'loaded' | `replay-${Policy}`;

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

function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage);
}

function errorText(cause: unknown): string {
  if (cause instanceof PpoArtifactMissingError) {
    return cause.status === undefined
      ? t('ppo.errorMissing', { url: cause.url })
      : t('ppo.errorMissingStatus', { url: cause.url, status: cause.status });
  }
  if (cause instanceof PpoLogFormatError) return t('ppo.errorLogFormat');
  return cause instanceof Error ? cause.message : String(cause);
}

function statusText(status: Status): string {
  if (status === 'idle' || status === 'loaded') return t(`ppo.status.${status}`);
  const policy = status === 'replay-trained' ? 'trained' : 'untrained';
  return t('ppo.status.replay', { policy: t(`ppo.policy.${policy}`) });
}

function LanguageSwitcher({ lang }: { lang: Language }) {
  return (
    <div style={{ display: 'flex', gap: 4 }} role="group" aria-label={t('language.label')}>
      {(['fr', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          data-testid={`ppo-lang-${code}`}
          aria-label={`${t('language.label')} — ${code.toUpperCase()}`}
          aria-pressed={lang === code}
          onClick={() => setLanguage(code)}
          style={lang === code ? activeBtn : btn}
        >
          {t(`language.${code}`)}
        </button>
      ))}
    </div>
  );
}

export default function PpoReplayApp() {
  const lang = useLanguage();
  const [manifest, setManifest] = useState<PpoManifest | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [policy, setPolicy] = useState<Policy>('untrained');
  const [seed, setSeed] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<PpoSeedSummary[]>([]);
  const [position, setPosition] = useState(0.2);
  const [episodeReturn, setEpisodeReturn] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [curves, setCurves] = useState<Record<string, number>[]>([]);
  const agentRef = useRef<PPOAgent | null>(null);
  const running = useRef(false);

  const manifestUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('manifest') ?? ppoArtifactUrl('manifest.json');
  }, []);

  const loadPolicy = useCallback(async (kind: Policy, nextSeed: number) => {
    agentRef.current?.dispose?.();
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [32, 32],
      storageProvider: httpModelProvider(ppoArtifactUrl()),
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
            await fetchJson<unknown>(ppoArtifactUrl(`seed-${seed}/episodes.json`)),
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
          loadedSummaries.push(
            await fetchJson<PpoSeedSummary>(ppoArtifactUrl(`seed-${seedId}/summary.json`)),
          );
        }
        if (cancelled) return;
        setCurves(chart);
        setSummaries(loadedSummaries);
        setManifest(data);
        await loadPolicy('untrained', data.selectedSeed);
        setStatus('loaded');
      } catch (cause) {
        if (!cancelled) setError(cause);
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

  const num = (value: number | null | undefined, digits = 4) =>
    formatPpoNumber(value, lang, t('ppo.absent'), digits);

  if (error) {
    return (
      <div data-testid="ppo-error" style={page}>
        <header style={headerStyle}>
          <h1 style={{ margin: 0 }}>{t('ppo.heading')}</h1>
          <LanguageSwitcher lang={lang} />
        </header>
        <p role="alert">{errorText(error)}</p>
        <p>{t('ppo.noSimulatedSuccess')}</p>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div data-testid="ppo-loading" style={page}>
        {t('ppo.loading')}
      </div>
    );
  }

  const activeSummary = summaries.find((row) => row.seed === seed);

  return (
    <div style={page}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>{t('ppo.heading')}</h1>
          <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>
            {t('ppo.subtitle', { seed: seed ?? '', sha: manifest.gitSha.slice(0, 12) })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href={import.meta.env.BASE_URL} style={{ color: '#a5b4fc' }}>{t('ppo.liveDqn')}</a>
          <LanguageSwitcher lang={lang} />
        </div>
      </header>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {manifest.seeds.map((seedId) => (
          <button
            key={seedId}
            data-testid={`ppo-seed-${seedId}`}
            onClick={() => void loadPolicy(policy, seedId)}
            style={seed === seedId ? activeBtn : btn}
          >
            {t('ppo.seedButton', { seed: seedId })}
          </button>
        ))}
        <button
          data-testid="ppo-untrained"
          onClick={() => seed !== null && void loadPolicy('untrained', seed)}
          style={policy === 'untrained' ? activeBtn : btn}
        >
          {t('ppo.replayUntrained')}
        </button>
        <button
          data-testid="ppo-trained"
          onClick={() => seed !== null && void loadPolicy('trained', seed)}
          style={policy === 'trained' ? activeBtn : btn}
        >
          {t('ppo.replayTrained')}
        </button>
        <button data-testid="ppo-play" onClick={() => void replay()} style={btn}>
          {t('ppo.playGreedy')}
        </button>
      </div>

      <p data-testid="ppo-greedy-from-file">
        {t('ppo.greedyEval', {
          untrained: num(activeSummary?.untrainedGreedyEvalMean),
          trained: num(activeSummary?.greedyEvalMean),
          gap: num(activeSummary?.greedyGap),
        })}
        <br />
        {t('ppo.greedyFrom02', {
          untrained: num(activeSummary?.untrainedGreedyReturnAt02),
          trained: num(activeSummary?.trainedGreedyReturnAt02),
        })}
      </p>

      <p data-testid="ppo-policy">
        {t('ppo.activePolicy')} <strong>{t(`ppo.policy.${policy}`)}</strong> ·{' '}
        {t('ppo.policyDetails', {
          checkpoint: `seed-${seed}/${policy}`,
          status: statusText(status),
          episodeReturn: num(episodeReturn, 3),
        })}
      </p>

      <div data-testid="ppo-canvas" style={{ height: 280, border: '1px solid #334155', borderRadius: 8, overflow: 'hidden' }}>
        <Canvas shadows camera={{ position: [0, 3.2, 7], fov: 45 }}>
          <Scene position={position} />
        </Canvas>
      </div>

      <div data-testid="ppo-chart" style={{ height: 320, marginTop: 16 }}>
        <h2 style={{ fontSize: 16 }}>{t('ppo.chartTitle')}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={curves}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="episode" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
              labelFormatter={(episode) => t('ppo.chartEpisode', { episode: String(episode) })}
              formatter={(value) => (typeof value === 'number' ? num(value, 3) : String(value))}
            />
            <Legend />
            {manifest.seeds.map((seed, index) => (
              <Line
                key={seed}
                type="monotone"
                dataKey={`seed ${seed}`}
                name={t('ppo.chartSeries', { seed })}
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
            {t('ppo.seedResult', {
              seed: row.seed,
              first: num(row.firstMean20),
              last: num(row.lastMean20),
              untrained: num(row.untrainedGreedyEvalMean),
              trained: num(row.greedyEvalMean),
              gap: num(row.greedyGap),
            })}{' '}
            {row.improved ? t('ppo.improved') : t('ppo.notImproved')}
          </li>
        ))}
      </ul>
    </div>
  );
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
};

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
