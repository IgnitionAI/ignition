import { Canvas } from '@react-three/fiber';
import * as tf from '@tensorflow/tfjs';
import {
  Component,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  XAxis,
  YAxis,
} from 'recharts';
import { PpoArtifactMissingError } from '../ppo/artifacts';
import { httpModelProvider } from '../ppo/http-provider';
import { getLanguage, setLanguage, subscribe, t, type Language } from '../i18n';
import {
  changedVariable,
  epsilonSteps,
  formatAxis,
  formatNumber,
  niceTicks,
  formatPercent,
  formatSigned,
  formatSteps,
  loadBench,
  manifestOverride,
  qRows,
  readResults,
  chooseReading,
  readOverestimation,
  peakGaps,
  OVERESTIMATION_PEAK,
  type Rl2Peak,
  type ByRun,
  returnRows,
  rl2ManifestUrl,
  Rl2BenchMissingError,
  seriesKey,
  sharedDomain,
  stepTicks,
  type ChartRow,
  type Rl2BenchData,
  type Rl2Problem,
  type Rl2Summary,
} from './artifacts';
import { RL2_ALGOS, RL2_BENCHES, RL2_BIN_STEPS, RL2_CONTROL_BENCH, type Rl2Algo } from './benches';
import { nav1dStep, Scene } from './Scene';

// Variant hues at equal relative luminance (0.389 / 0.391), same weight everywhere.
export const HUE: Record<Rl2Algo, string> = { dqn: '#5eadf5', 'double-dqn': '#e8954a' };
const TEXT = '#e2e8f0';
const MUTED = '#94a3b8';
const BORDER = '#334155';
const NARROW = 720;
const START = 0.2;
const STEP_MS = 120;
const FALLBACK_MAX_STEPS = 25;
const testIdOf: Record<Rl2Algo, string> = { dqn: 'dqn', 'double-dqn': 'double' };

// ── small hooks ──────────────────────────────────────────────────────────────

function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage);
}

function subscribeResize(listener: () => void) {
  window.addEventListener('resize', listener);
  return () => window.removeEventListener('resize', listener);
}

function useWidth(): number {
  return useSyncExternalStore(subscribeResize, () => window.innerWidth);
}

// ── error helpers ────────────────────────────────────────────────────────────

function problemText(p: Rl2Problem): string {
  if (p.format) return t('rl2.error.format', { url: p.url });
  return p.status === undefined ? t('rl2.error.missing', { url: p.url }) : t('rl2.error.missingStatus', { url: p.url, status: p.status });
}

function ProblemList({ problems }: { problems: Rl2Problem[] }) {
  return (
    <ul style={{ margin: '8px 0', paddingLeft: 20, wordBreak: 'break-all' }}>
      {problems.map((p) => (
        <li key={p.url} data-detail={p.format}>{problemText(p)}</li>
      ))}
    </ul>
  );
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <WebglMessage alert /> : this.props.children;
  }
}

// `alert` only when shown by the error boundary: R3F keeps the Canvas fallback inside
// the <canvas> element, where it must not be announced while WebGL works.
function WebglMessage({ alert = false }: { alert?: boolean }) {
  return (
    <div role={alert ? 'alert' : undefined} style={{ ...alertBox, margin: 12 }}>
      {t('rl2.replay.webgl')}
    </div>
  );
}

// ── replay state ─────────────────────────────────────────────────────────────

type Phase = 'loading' | 'loaded' | 'running' | 'done' | 'limit' | 'error';

interface PanelState {
  phase: Phase;
  step: number;
  ret: number;
  pos: number;
  error?: { url: string; status?: number };
}

const initialPanel = (): PanelState => ({ phase: 'loading', step: 0, ret: 0, pos: START });

function greedyAction(model: tf.LayersModel, pos: number): number {
  return tf.tidy(() => {
    const q = model.predict(tf.tensor2d([[pos]])) as tf.Tensor;
    return q.argMax(1).dataSync()[0];
  });
}

// ── page ─────────────────────────────────────────────────────────────────────

type BenchState = { status: 'loading' } | { status: 'missing'; url: string; httpStatus?: number } | { status: 'loaded'; data: Rl2BenchData };

function initialBenchIndex(): number {
  const id = new URLSearchParams(window.location.search).get('bench');
  const index = RL2_BENCHES.findIndex((b) => b.id === id);
  return index >= 0 ? index : 0;
}

export default function Rl2App() {
  const lang = useLanguage();
  const width = useWidth();
  const narrow = width < NARROW;
  const [benchIndex, setBenchIndex] = useState(initialBenchIndex);
  const bench = RL2_BENCHES[benchIndex];
  const [benchState, setBenchState] = useState<BenchState>({ status: 'loading' });
  const [seed, setSeed] = useState<number | null>(null);

  const manifestUrl = useMemo(
    () => manifestOverride(window.location.search, window.location.href) ?? rl2ManifestUrl(bench.dir),
    // The override applies to the bench selected at load time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bench.dir],
  );

  useEffect(() => {
    let cancelled = false;
    setBenchState({ status: 'loading' });
    setSeed(null);
    loadBench(manifestUrl)
      .then((data) => {
        if (cancelled) return;
        setBenchState({ status: 'loaded', data });
        setSeed(data.manifest.seeds[0]);
      })
      .catch((cause) => {
        if (cancelled) return;
        if (cause instanceof Rl2BenchMissingError) setBenchState({ status: 'missing', url: cause.url, httpStatus: cause.status });
        else setBenchState({ status: 'missing', url: `${manifestUrl} — ${cause instanceof Error ? cause.message : String(cause)}` });
      });
    return () => {
      cancelled = true;
    };
  }, [manifestUrl]);

  const selectBench = (index: number) => {
    if (index === benchIndex) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('manifest');
    url.searchParams.set('bench', RL2_BENCHES[index].id);
    window.history.replaceState(null, '', url);
    setBenchIndex(index);
  };

  const data = benchState.status === 'loaded' ? benchState.data : null;
  const num = (value: number | null | undefined, digits = 4) => formatNumber(value, lang, t('rl2.absent'), digits);

  return (
    <div style={page}>
      <header style={headerStyle}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: narrow ? 28 : 32, fontWeight: 700 }}>{t('rl2.heading')}</h1>
          {data && (
            <p data-testid="rl2-subtitle" style={{ color: MUTED, margin: '8px 0 0' }}>
              {t('rl2.subtitle', {
                sha: data.manifest.gitSha.slice(0, 12),
                budget: formatInt(data.manifest.budget.envStepsPerRun, lang),
                seeds: data.manifest.seeds.join(', '),
              })}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <a href={`${import.meta.env.BASE_URL}ppo.html`} style={linkStyle}>{t('rl2.linkPpo')}</a>
          <a href={import.meta.env.BASE_URL} style={linkStyle}>{t('rl2.linkLive')}</a>
          <LanguageSwitcher lang={lang} />
        </div>
      </header>

      {RL2_BENCHES.length > 1 && (
        <div role="group" aria-label={t('rl2.bench.label')} style={{ ...row, marginTop: 16 }}>
          {RL2_BENCHES.map((b, index) => (
            <button
              key={b.id}
              type="button"
              data-testid={`rl2-bench-${b.id}`}
              aria-pressed={index === benchIndex}
              onClick={() => selectBench(index)}
              style={index === benchIndex ? activeBtn : btn}
            >
              {t(`rl2.bench.${b.id}`)}
            </button>
          ))}
        </div>
      )}

      {benchState.status === 'loading' && (
        <p data-testid="rl2-loading" style={{ marginTop: 16 }}>{t('rl2.loading')}</p>
      )}

      {benchState.status === 'missing' && (
        <section data-testid="rl2-bench-error" role="alert" style={{ ...alertBox, marginTop: 16 }}>
          <p style={{ margin: 0 }}>
            {benchState.httpStatus === undefined
              ? t('rl2.bench.missing', { url: benchState.url })
              : t('rl2.bench.missingStatus', { url: benchState.url, status: benchState.httpStatus })}
          </p>
          <p style={{ margin: '8px 0 0' }}>{t('rl2.bench.missingHint')}</p>
        </section>
      )}

      {data && seed !== null && (
        <BenchView key={data.manifestUrl} data={data} benchId={bench.id} seed={seed} setSeed={setSeed} narrow={narrow} lang={lang} num={num} />
      )}
    </div>
  );
}

function formatInt(value: number, lang: Language): string {
  return value.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US');
}

interface BenchViewProps {
  data: Rl2BenchData;
  benchId: string;
  seed: number;
  setSeed: (seed: number) => void;
  narrow: boolean;
  lang: Language;
  num: (value: number | null | undefined, digits?: number) => string;
}

function BenchView({ data, benchId, seed, setSeed, narrow, lang, num }: BenchViewProps) {
  const { experiment } = data;
  const changed = experiment ? changedVariable(experiment) : null;
  return (
    <>
      {experiment && (
        <p data-testid="rl2-changed" style={{ margin: '16px 0 0' }}>
          {changed === null
            ? t('rl2.bench.changedNone')
            : changed.kind === 'gaussianRewardNoise'
              ? t('rl2.bench.changedNoise', { sigma: lang === 'fr' ? String(changed.sigma).replace('.', ',') : String(changed.sigma) })
              : t('rl2.bench.changedRaw', { value: changed.text })}
        </p>
      )}

      {experiment && (
        <section data-testid="rl2-protocol" style={{ ...block, marginTop: 16 }}>
          <h2 style={h2}>{t('rl2.protocol')}</h2>
          <ProtocolLine experiment={experiment} narrow={narrow} lang={lang} num={num} />
        </section>
      )}

      <ReplayBlock data={data} seed={seed} setSeed={setSeed} narrow={narrow} lang={lang} num={num} />

      {data.comparison.ok ? (
        <ComparisonBlocks data={data} benchId={benchId} narrow={narrow} lang={lang} num={num} />
      ) : (
        <section data-testid="rl2-error" role="alert" style={{ ...alertBox, marginTop: 16 }}>
          <h2 style={{ ...h2, marginTop: 0 }}>{t('rl2.error.comparisonHeading')}</h2>
          <ProblemList problems={data.comparison.problems} />
          <p style={{ margin: 0 }}>{t('rl2.error.noSimulated')}</p>
        </section>
      )}
      <p style={{ color: MUTED, marginTop: 16 }}>{t('rl2.reading')}</p>
    </>
  );
}

function ProtocolLine({ experiment, narrow, lang, num }: { experiment: NonNullable<Rl2BenchData['experiment']>; narrow: boolean; lang: Language; num: BenchViewProps['num'] }) {
  const a = experiment.agent;
  const text = t('rl2.protocolLine', {
    budget: formatInt(experiment.budget.envStepsPerRun, lang),
    layers: `[${a.hiddenLayers.join(', ')}]`,
    gamma: num(a.gamma, 2),
    target: formatInt(a.targetUpdateFrequency, lang),
    eps0: num(a.epsilon, 2),
    eps1: num(a.minEpsilon, 2),
    epsSteps: formatInt(epsilonSteps(a), lang),
    lr: String(a.lr).replace('.', lang === 'fr' ? ',' : '.'),
    batch: a.batchSize,
    seeds: experiment.seeds.join(', '),
  });
  if (!narrow) return <p style={{ margin: 0 }}>{text}</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 20 }}>
      {text.split(' · ').map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// ── B. replay ────────────────────────────────────────────────────────────────

function ReplayBlock({ data, seed, setSeed, narrow, lang, num }: Omit<BenchViewProps, 'benchId'>) {
  const [panels, setPanels] = useState<Record<Rl2Algo, PanelState>>({ dqn: initialPanel(), 'double-dqn': initialPanel() });
  const models = useRef<Partial<Record<Rl2Algo, tf.LayersModel>>>({});
  const runToken = useRef(0);
  const maxSteps = data.experiment?.budget.maxStepsPerEpisode ?? FALLBACK_MAX_STEPS;

  useEffect(() => {
    let cancelled = false;
    runToken.current += 1;
    setPanels({ dqn: initialPanel(), 'double-dqn': initialPanel() });
    for (const algo of RL2_ALGOS) {
      const provider = httpModelProvider(`${data.dirUrl}${algo}`);
      provider
        .load(`seed-${seed}/trained`)
        .then((model) => {
          if (cancelled) {
            model.dispose();
            return;
          }
          models.current[algo]?.dispose();
          models.current[algo] = model;
          setPanels((prev) => ({ ...prev, [algo]: { ...initialPanel(), phase: 'loaded' } }));
        })
        .catch((cause) => {
          if (cancelled) return;
          models.current[algo]?.dispose();
          delete models.current[algo];
          const url = cause instanceof PpoArtifactMissingError ? cause.url : `${data.dirUrl}${algo}/seed-${seed}/trained/model.json`;
          const status = cause instanceof PpoArtifactMissingError ? cause.status : undefined;
          setPanels((prev) => ({ ...prev, [algo]: { ...initialPanel(), phase: 'error', error: { url, status } } }));
        });
    }
    return () => {
      cancelled = true;
      runToken.current += 1;
    };
  }, [data.dirUrl, seed]);

  useEffect(
    () => () => {
      for (const algo of RL2_ALGOS) models.current[algo]?.dispose();
      models.current = {};
    },
    [],
  );

  const anyError = RL2_ALGOS.some((algo) => panels[algo].phase === 'error');
  const ready = RL2_ALGOS.every((algo) => panels[algo].phase !== 'loading' && panels[algo].phase !== 'error');
  const running = RL2_ALGOS.some((algo) => panels[algo].phase === 'running');

  const reset = useCallback(() => {
    runToken.current += 1;
    setPanels((prev) => {
      const next = { ...prev };
      for (const algo of RL2_ALGOS) if (prev[algo].phase !== 'error' && prev[algo].phase !== 'loading') next[algo] = { ...initialPanel(), phase: 'loaded' };
      return next;
    });
  }, []);

  const playBoth = useCallback(async () => {
    const token = ++runToken.current;
    const state: Record<Rl2Algo, PanelState> = {
      dqn: { phase: 'running', step: 0, ret: 0, pos: START },
      'double-dqn': { phase: 'running', step: 0, ret: 0, pos: START },
    };
    setPanels({ ...state });
    for (let step = 1; step <= maxSteps; step++) {
      await new Promise((resolve) => setTimeout(resolve, STEP_MS));
      if (token !== runToken.current) return;
      for (const algo of RL2_ALGOS) {
        const s = state[algo];
        const model = models.current[algo];
        if (s.phase !== 'running' || !model) continue;
        const { newPos, reward, done } = nav1dStep(s.pos, greedyAction(model, s.pos));
        state[algo] = {
          phase: done ? 'done' : step === maxSteps ? 'limit' : 'running',
          step,
          ret: s.ret + reward,
          pos: newPos,
        };
      }
      setPanels({ ...state });
      if (RL2_ALGOS.every((algo) => state[algo].phase !== 'running')) return;
    }
  }, [maxSteps]);

  return (
    <section data-testid="rl2-replay" style={{ ...block, marginTop: 16 }}>
      <h2 style={h2}>{t('rl2.replay.heading')}</h2>
      <div style={row}>
        {data.manifest.seeds.map((s) => (
          <button key={s} type="button" data-testid={`rl2-seed-${s}`} aria-pressed={s === seed} onClick={() => setSeed(s)} style={s === seed ? activeBtn : btn}>
            {t('rl2.replay.seedButton', { seed: s })}
          </button>
        ))}
        <button
          type="button"
          data-testid="rl2-play"
          disabled={!ready || running}
          onClick={() => void playBoth()}
          style={{ ...btn, ...(narrow ? { width: '100%' } : {}), ...(!ready || running ? disabledBtn : {}) }}
        >
          {t('rl2.replay.playBoth')}
        </button>
        <button type="button" data-testid="rl2-reset" onClick={reset} style={{ ...btn, ...(narrow ? { width: '100%' } : {}) }}>
          {t('rl2.replay.reset')}
        </button>
      </div>
      <p style={{ color: MUTED, fontSize: 14, margin: '8px 0 0' }}>{t('rl2.replay.greedyNote')}</p>
      {anyError && (
        <p data-testid="rl2-play-disabled" style={{ fontSize: 14, margin: '8px 0 0' }}>
          {t('rl2.replay.playDisabled')}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 16, marginTop: 16 }}>
        {RL2_ALGOS.map((algo) => (
          <ReplayPanel key={algo} algo={algo} seed={seed} panel={panels[algo]} narrow={narrow} lang={lang} num={num} />
        ))}
      </div>
    </section>
  );
}

function ReplayPanel({ algo, seed, panel, narrow, num }: { algo: Rl2Algo; seed: number; panel: PanelState; narrow: boolean; lang: Language; num: BenchViewProps['num'] }) {
  const height = narrow ? 200 : 280;
  const state =
    panel.phase === 'done'
      ? t('rl2.replay.state.done', { step: panel.step })
      : panel.phase === 'limit'
        ? t('rl2.replay.state.limit')
        : panel.phase === 'error'
          ? ''
          : t(`rl2.replay.state.${panel.phase}`);
  return (
    <div data-testid={`rl2-panel-${testIdOf[algo]}`} style={{ border: `1px solid ${BORDER}`, borderTop: `3px solid ${HUE[algo]}`, borderRadius: 8, overflow: 'hidden', minWidth: 0 }}>
      <h2 style={{ ...h2, margin: 0, padding: '8px 12px' }}>{t(`rl2.variant.${algo}`)}</h2>
      <div style={{ height, position: 'relative' }}>
        {panel.phase === 'error' && panel.error ? (
          <div data-testid={`rl2-replay-error-${testIdOf[algo]}`} role="alert" style={{ ...alertBox, margin: 12, wordBreak: 'break-all' }}>
            {panel.error.status === undefined
              ? t('rl2.replay.checkpointMissing', { url: panel.error.url })
              : t('rl2.replay.checkpointMissingStatus', { url: panel.error.url, status: panel.error.status })}
          </div>
        ) : (
          <SceneBoundary>
            <Canvas shadows camera={{ position: [0, 3.2, 7], fov: 45 }} fallback={<WebglMessage />}>
              <Scene position={panel.pos} />
            </Canvas>
          </SceneBoundary>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '8px 12px', color: MUTED, fontSize: 14 }}>
        {panel.phase !== 'error' && (
          <div data-testid={`rl2-status-${testIdOf[algo]}`}>
            {t('rl2.replay.statusLine', { step: panel.step, ret: num(panel.ret, 3), state })}
          </div>
        )}
        <div>{t('rl2.replay.checkpoint', { path: `${algo}/seed-${seed}/trained` })}</div>
      </div>
    </div>
  );
}

// ── C, D, E: comparison ──────────────────────────────────────────────────────

function ComparisonBlocks({ data, benchId, narrow, lang, num }: Omit<BenchViewProps, 'seed' | 'setSeed'>) {
  if (!data.comparison.ok) return null;
  const { summaries, binned, experiment } = data.comparison.data;
  const { seeds, budget, gamma } = data.manifest;
  const reading = readResults(summaries, seeds);
  const over = data.q.ok ? readOverestimation(data.q.data, seeds) : null;
  const peaks = data.q.ok ? peakGaps(data.q.data, seeds) : null;
  const noisy = changedVariable(experiment)?.kind === 'gaussianRewardNoise';
  const absent = t('rl2.absent');
  const sg = (v: number) => formatSigned(v, lang, absent);
  const key = chooseReading(benchId === RL2_CONTROL_BENCH, reading, over);
  const vars: Record<string, string> = {
    min: sg(reading.finalGapMin),
    max: sg(reading.finalGapMax),
    thr: num(OVERESTIMATION_PEAK, 2),
    ...(over
      ? {
          pmin: sg(over.peakMin),
          pmax: sg(over.peakMax),
          a0: sg(over.range.dqn[0]),
          a1: sg(over.range.dqn[1]),
          b0: sg(over.range['double-dqn'][0]),
          b1: sg(over.range['double-dqn'][1]),
          between: num(over.betweenVariants, 4),
          seedSpread: num(over.betweenSeeds, 4),
        }
      : {}),
  };
  const readingKey = { easy: 'rl2.readingEasy', same: 'rl2.readingSame', differs: 'rl2.readingDiffers', overBoth: 'rl2.readingOverBoth', overFacts: 'rl2.readingOverFacts' }[key];
  return (
    <>
      <ReturnsChart rows={returnRows(binned, seeds)} budget={budget.envStepsPerRun} narrow={narrow} lang={lang} num={num} noisy={noisy} />
      {data.q.ok ? (
        <QBlock rows={qRows(data.q.data, seeds)} budget={budget.envStepsPerRun} gamma={gamma} narrow={narrow} lang={lang} num={num} noisy={noisy} />
      ) : (
        <section data-testid="rl2-q-error" role="alert" style={{ ...alertBox, marginTop: 16 }}>
          <h2 style={{ ...h2, marginTop: 0 }}>{t('rl2.error.qHeading')}</h2>
          <ProblemList problems={data.q.problems} />
          <p style={{ margin: 0 }}>{t('rl2.error.qHint')}</p>
        </section>
      )}
      <ResultsTable summaries={summaries} peaks={peaks} seeds={seeds} narrow={narrow} lang={lang} num={num} />
      <p data-testid="rl2-reading" data-reading={key} style={{ marginTop: 16 }}>
        {t(readingKey, vars)}
      </p>
    </>
  );
}

const axisProps = { stroke: '#888', tick: { fill: '#888', fontSize: 12 } };
const tooltipStyle = { background: '#0f172a', border: `1px solid ${BORDER}`, color: TEXT };

function xAxis(budget: number, lang: Language) {
  return (
    <XAxis
      dataKey="x"
      type="number"
      domain={[0, budget]}
      ticks={stepTicks(budget)}
      interval={0}
      tickFormatter={(v: number) => formatSteps(v, lang)}
      {...axisProps}
    />
  );
}

function yAxis(range: [number, number], lang: Language) {
  const { domain, ticks, digits } = niceTicks(range);
  return (
    <YAxis type="number" domain={domain} ticks={ticks} interval={0} allowDataOverflow tickFormatter={(v: number) => formatAxis(v, lang, digits)} width={52} {...axisProps} />
  );
}

function Legend2() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: TEXT, marginTop: 8 }}>
      {RL2_ALGOS.map((algo) => (
        <span key={algo} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 2, background: HUE[algo], display: 'inline-block' }} />
          {t(`rl2.variant.${algo}`)}
        </span>
      ))}
    </div>
  );
}

/**
 * Where the two mean lines overlap, the last one drawn would hide the other.
 * Both stay solid and each is clipped to alternating vertical stripes in screen
 * coordinates (first variant: even stripes, second: odd ones), so an overlap
 * reads as one line alternating both colours, whatever the path length.
 */
const STRIPE_PX = 8;
const STRIPE_PX_NARROW = 6;
/** Vertical margin so the clip never trims a stroke lying on the plot edge. */
const STRIPE_PAD = 4;

/** One clip-path id per variant, unique per chart. */
function useStripeIds(): Record<Rl2Algo, string> {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return useMemo(() => Object.fromEntries(RL2_ALGOS.map((algo) => [algo, `rl2-stripes-${uid}-${algo}`])) as Record<Rl2Algo, string>, [uid]);
}

/** Rendered inside the chart: stripe clip paths sized on the plot area. */
function StripeClips({ ids, stripe }: { ids: Record<Rl2Algo, string>; stripe: number }) {
  const plot = usePlotArea();
  if (!plot || plot.width <= 0) return null;
  const count = Math.ceil(plot.width / stripe);
  return (
    <defs>
      {RL2_ALGOS.map((algo, parity) => (
        <clipPath key={algo} id={ids[algo]} clipPathUnits="userSpaceOnUse">
          {Array.from({ length: count }, (_, i) => i)
            .filter((i) => i % 2 === parity % 2)
            .map((i) => (
              <rect key={i} x={plot.x + i * stripe} y={plot.y - STRIPE_PAD} width={Math.min(stripe, plot.width - i * stripe)} height={plot.height + 2 * STRIPE_PAD} />
            ))}
        </clipPath>
      ))}
    </defs>
  );
}

/**
 * Line props for a mean line clipped to its stripes. Line overrides a plain
 * clipPath prop with its plot-area clip; a shape object is merged last, so the
 * stripes (bounded by the plot area) replace that clip.
 */
function stripedLine(ids: Record<Rl2Algo, string>, algo: Rl2Algo) {
  return { strokeWidth: 2, shape: { clipPath: `url(#${ids[algo]})` } };
}

function ReturnsChart({ rows, budget, narrow, lang, num, noisy }: { rows: ChartRow[]; budget: number; narrow: boolean; lang: Language; num: BenchViewProps['num']; noisy: boolean }) {
  const seedKeys = (algo: Rl2Algo) => Object.keys(rows[0] ?? {}).filter((k) => k.startsWith(seriesKey(algo, 's')));
  const domain = sharedDomain(rows, RL2_ALGOS.flatMap((algo) => [seriesKey(algo, 'band'), ...seedKeys(algo)]));
  const stripeIds = useStripeIds();
  return (
    <section data-testid="rl2-chart-returns" style={{ ...block, marginTop: 16 }}>
      <h2 style={h2}>{t('rl2.chartReturns')}</h2>
      <p style={{ color: MUTED, fontSize: 14, margin: '0 0 8px' }}>{t('rl2.binNote', { bin: RL2_BIN_STEPS })}</p>
      {noisy && <p data-testid="rl2-true-return-note" style={{ color: MUTED, fontSize: 14, margin: '0 0 8px' }}>{t('rl2.trueReturnNote')}</p>}
      <ResponsiveContainer width="100%" height={narrow ? 240 : 280}>
        <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          {xAxis(budget, lang)}
          {yAxis(domain, lang)}
          <Tooltip content={<ReturnsTooltip lang={lang} num={num} />} />
          {RL2_ALGOS.map((algo) => (
            <Area key={`${algo}-band`} type="linear" dataKey={seriesKey(algo, 'band')} fill={HUE[algo]} fillOpacity={0.12} stroke="none" isAnimationActive={false} activeDot={false} />
          ))}
          {RL2_ALGOS.flatMap((algo) =>
            seedKeys(algo).map((key) => (
              <Line key={key} type="linear" dataKey={key} stroke={HUE[algo]} strokeWidth={1} strokeOpacity={0.35} dot={false} activeDot={false} isAnimationActive={false} />
            )),
          )}
          <StripeClips ids={stripeIds} stripe={narrow ? STRIPE_PX_NARROW : STRIPE_PX} />
          {RL2_ALGOS.map((algo) => (
            <Line key={`${algo}-mean`} type="linear" dataKey={seriesKey(algo, 'mean')} stroke={HUE[algo]} {...stripedLine(stripeIds, algo)} dot={false} isAnimationActive={false} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      <p style={{ color: MUTED, fontSize: 14, margin: '4px 0 0', textAlign: 'center' }}>{t('rl2.xAxis')}</p>
      <Legend2 />
      <p style={{ color: MUTED, fontSize: 14, margin: '4px 0 0' }}>{t('rl2.band')}</p>
      <p data-testid="rl2-overlap-note" style={{ color: MUTED, fontSize: 14, margin: '4px 0 0' }}>{t('rl2.overlapNote')}</p>
    </section>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload?: ChartRow }[];
  lang: Language;
  num: BenchViewProps['num'];
}

function ReturnsTooltip({ active, payload, lang, num }: TooltipProps) {
  const rowData = payload?.[0]?.payload;
  if (!active || !rowData) return null;
  return (
    <div style={{ ...tooltipStyle, padding: 8, fontSize: 13 }}>
      <div>{t('rl2.tooltipSteps', { from: formatInt(Number(rowData.start), lang), to: formatInt(Number(rowData.x), lang) })}</div>
      {RL2_ALGOS.map((algo) => {
        const band = rowData[seriesKey(algo, 'band')] as [number, number] | null;
        return (
          <div key={algo} style={{ marginTop: 4 }}>
            <span style={{ color: HUE[algo] }}>{t(`rl2.variant.${algo}`)}</span>{' '}
            {t('rl2.tooltipMean', { mean: num(rowData[seriesKey(algo, 'mean')] as number | null, 3), min: num(band?.[0], 3), max: num(band?.[1], 3) })}
            <br />
            {t('rl2.tooltipEpisodes', { from: String(rowData[seriesKey(algo, 'ep0')] ?? '–'), to: String(rowData[seriesKey(algo, 'ep1')] ?? '–') })}
          </div>
        );
      })}
    </div>
  );
}

function QTooltip({ active, payload, lang, num, keys }: TooltipProps & { keys: { key: string; label: string; color: string }[] }) {
  const rowData = payload?.[0]?.payload;
  if (!active || !rowData) return null;
  return (
    <div style={{ ...tooltipStyle, padding: 8, fontSize: 13 }}>
      <div>{formatInt(Number(rowData.x), lang)} · {t('rl2.xAxis')}</div>
      {keys.map(({ key, label, color }) => (
        <div key={key}>
          <span style={{ color }}>{label}</span> {num(rowData[key] as number, 4)}
        </div>
      ))}
    </div>
  );
}

function QBlock({ rows, budget, gamma, narrow, lang, num, noisy }: { rows: ChartRow[]; budget: number; gamma: number; narrow: boolean; lang: Language; num: BenchViewProps['num']; noisy: boolean }) {
  const qDomain = sharedDomain(rows, RL2_ALGOS.flatMap((algo) => [seriesKey(algo, 'q'), seriesKey(algo, 'g')]));
  const gapDomain = sharedDomain(rows, RL2_ALGOS.map((algo) => seriesKey(algo, 'gap')), 0.1);
  const gapDomainWithZero: [number, number] = [Math.min(gapDomain[0], 0), Math.max(gapDomain[1], 0)];
  const height = narrow ? 180 : 200;
  const stripeIds = useStripeIds();
  return (
    <section data-testid="rl2-chart-q" style={{ ...block, marginTop: 16 }}>
      <h2 style={h2}>{t('rl2.chartQ', { gamma: num(gamma, 2) })}</h2>
      <p style={{ color: MUTED, fontSize: 14, margin: '0 0 8px' }}>{t('rl2.qNote')}</p>
      {noisy && <p style={{ color: MUTED, fontSize: 14, margin: '0 0 8px' }}>{t('rl2.trueReturnQNote')}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 16 }}>
        {RL2_ALGOS.map((algo) => (
          <div key={algo} data-testid={`rl2-chart-q-${testIdOf[algo]}`} style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 14, margin: '0 0 4px', fontWeight: 400 }}>{t(`rl2.variant.${algo}`)}</h3>
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                {xAxis(budget, lang)}
                {yAxis(qDomain, lang)}
                <Tooltip
                  content={
                    <QTooltip
                      lang={lang}
                      num={num}
                      keys={[
                        { key: seriesKey(algo, 'q'), label: t('rl2.qEstimated'), color: HUE[algo] },
                        { key: seriesKey(algo, 'g'), label: t('rl2.qObserved'), color: HUE[algo] },
                      ]}
                    />
                  }
                />
                <Area type="linear" dataKey={seriesKey(algo, 'area')} fill={HUE[algo]} fillOpacity={0.12} stroke="none" isAnimationActive={false} activeDot={false} />
                <Line type="linear" dataKey={seriesKey(algo, 'q')} name={t('rl2.qEstimated')} stroke={HUE[algo]} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
                <Line type="linear" dataKey={seriesKey(algo, 'g')} name={t('rl2.qObserved')} stroke={HUE[algo]} strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: MUTED, flexWrap: 'wrap' }}>
              <span>
                <svg width="22" height="6" aria-hidden="true">
                  <line x1="0" y1="3" x2="22" y2="3" stroke={HUE[algo]} strokeWidth="2" strokeDasharray="6 4" />
                </svg>{' '}
                {t('rl2.qEstimated')}
              </span>
              <span>
                <svg width="22" height="6" aria-hidden="true">
                  <line x1="0" y1="3" x2="22" y2="3" stroke={HUE[algo]} strokeWidth="2" />
                </svg>{' '}
                {t('rl2.qObserved')}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div data-testid="rl2-chart-gap" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, margin: '0 0 4px', fontWeight: 400 }}>{t('rl2.gap')}</h3>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            {xAxis(budget, lang)}
            {yAxis(gapDomainWithZero, lang)}
            <Tooltip
              content={
                <QTooltip lang={lang} num={num} keys={RL2_ALGOS.map((algo) => ({ key: seriesKey(algo, 'gap'), label: t(`rl2.variant.${algo}`), color: HUE[algo] }))} />
              }
            />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" label={{ value: t('rl2.gapZero'), fill: MUTED, fontSize: 12, position: 'insideTopRight' }} />
            <StripeClips ids={stripeIds} stripe={narrow ? STRIPE_PX_NARROW : STRIPE_PX} />
            {RL2_ALGOS.map((algo) => (
              <Line key={algo} type="linear" dataKey={seriesKey(algo, 'gap')} stroke={HUE[algo]} {...stripedLine(stripeIds, algo)} dot={false} isAnimationActive={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        <p style={{ color: MUTED, fontSize: 14, margin: '4px 0 0', textAlign: 'center' }}>{t('rl2.xAxis')}</p>
        <Legend2 />
        <p style={{ color: MUTED, fontSize: 14, margin: '4px 0 0' }}>{t('rl2.gapNote')}</p>
      </div>
    </section>
  );
}

type Metric = { key: string; label: (n: number) => string; get: (s: Rl2Summary, peak?: Rl2Peak) => number; kind: 'num' | 'pct' | 'signed' };

const METRICS: Metric[] = [
  { key: 'lastMean', label: (n) => t('rl2.table.lastMean', { n }), get: (s) => s.lastMeanReturn, kind: 'num' },
  { key: 'lastSuccess', label: (n) => t('rl2.table.lastSuccess', { n }), get: (s) => s.lastSuccessRate, kind: 'pct' },
  { key: 'greedy', label: () => t('rl2.table.greedy'), get: (s) => s.greedyEvalMean, kind: 'num' },
  { key: 'finalGap', label: () => t('rl2.table.finalGap'), get: (s) => s.finalQVsReturn.meanGap, kind: 'signed' },
  { key: 'gapHalf', label: () => t('rl2.table.gapHalf'), get: (s) => s.meanGapSecondHalf, kind: 'signed' },
];

/** Only when q-vs-return is readable: highest Q − G of the run over its evaluation points. */
const PEAK_METRIC: Metric = { key: 'peakGap', label: () => t('rl2.table.peakGap'), get: (_s, peak) => peak?.peak ?? NaN, kind: 'signed' };

function ResultsTable({ summaries, peaks, seeds, narrow, lang, num }: { summaries: Record<Rl2Algo, Record<number, Rl2Summary>>; peaks: ByRun<Rl2Peak> | null; seeds: number[]; narrow: boolean; lang: Language; num: BenchViewProps['num'] }) {
  const absent = t('rl2.absent');
  const show = (m: Metric, v: number) => (m.kind === 'pct' ? formatPercent(v, lang, absent) : m.kind === 'signed' ? formatSigned(v, lang, absent) : num(v));
  const diff = (m: Metric, a: number, b: number) =>
    m.kind === 'pct' ? `${formatSigned((b - a) * 100, lang, absent, 1)} pt` : formatSigned(b - a, lang, absent);
  const n = summaries.dqn[seeds[0]].lastEpisodesCount;
  const metrics = peaks ? [...METRICS, PEAK_METRIC] : METRICS;
  const peakText = (algo: Rl2Algo, seed: number) => (peaks ? ` · ${t('rl2.table.peakShort', { peak: formatSigned(peaks[algo][seed].peak, lang, absent) })}` : '');

  if (narrow) {
    return (
      <section data-testid="rl2-table" style={{ ...block, marginTop: 16 }}>
        <h2 style={h2}>{t('rl2.table.heading')}</h2>
        {seeds.map((seed) => {
          const a = summaries.dqn[seed];
          const b = summaries['double-dqn'][seed];
          const line = (algo: Rl2Algo, s: Rl2Summary) =>
            t('rl2.table.cardLine', {
              variant: t(`rl2.variant.${algo}`),
              ret: num(s.lastMeanReturn),
              succ: formatPercent(s.lastSuccessRate, lang, absent),
              greedy: num(s.greedyEvalMean),
              gap: formatSigned(s.finalQVsReturn.meanGap, lang, absent),
              half: formatSigned(s.meanGapSecondHalf, lang, absent),
            }) + peakText(algo, seed);
          return (
            <div key={seed} data-testid={`rl2-card-${seed}`} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, marginTop: 8 }}>
              <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>{t('rl2.table.seedTitle', { seed })}</h3>
              <p style={{ margin: '0 0 6px', borderLeft: `3px solid ${HUE.dqn}`, paddingLeft: 8 }}>{line('dqn', a)}</p>
              <p style={{ margin: '0 0 6px', borderLeft: `3px solid ${HUE['double-dqn']}`, paddingLeft: 8 }}>{line('double-dqn', b)}</p>
              <p style={{ margin: 0, color: TEXT }}>
                {t('rl2.table.cardDiff', {
                  ret: formatSigned(b.lastMeanReturn - a.lastMeanReturn, lang, absent),
                  gap: formatSigned(b.finalQVsReturn.meanGap - a.finalQVsReturn.meanGap, lang, absent),
                  half: formatSigned(b.meanGapSecondHalf - a.meanGapSecondHalf, lang, absent),
                })}
              </p>
            </div>
          );
        })}
      </section>
    );
  }

  return (
    <section data-testid="rl2-table" style={{ ...block, marginTop: 16 }}>
      <h2 style={h2}>{t('rl2.table.heading')}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            <th style={th}>{t('rl2.table.seed')}</th>
            <th style={th}>{t('rl2.table.metric')}</th>
            {RL2_ALGOS.map((algo) => (
              <th key={algo} style={{ ...th, textAlign: 'right', borderBottom: `3px solid ${HUE[algo]}` }}>{t(`rl2.variant.${algo}`)}</th>
            ))}
            <th style={{ ...th, textAlign: 'right' }}>{t('rl2.table.diff')}</th>
          </tr>
        </thead>
        <tbody>
          {seeds.flatMap((seed) =>
            metrics.map((m, i) => {
              const a = m.get(summaries.dqn[seed], peaks?.dqn[seed]);
              const b = m.get(summaries['double-dqn'][seed], peaks?.['double-dqn'][seed]);
              return (
                <tr key={`${seed}-${m.key}`} style={i === 0 ? { borderTop: `1px solid ${BORDER}` } : undefined}>
                  <td style={td}>{i === 0 ? seed : ''}</td>
                  <td style={td}>{m.label(n)}</td>
                  <td style={tdNum}>{show(m, a)}</td>
                  <td style={tdNum}>{show(m, b)}</td>
                  <td style={tdNum}>{diff(m, a, b)}</td>
                </tr>
              );
            }),
          )}
        </tbody>
      </table>
    </section>
  );
}

// ── shared UI ────────────────────────────────────────────────────────────────

function LanguageSwitcher({ lang }: { lang: Language }) {
  return (
    <div style={{ display: 'flex', gap: 4 }} role="group" aria-label={t('language.label')}>
      {(['fr', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          data-testid={`rl2-lang-${code}`}
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

const headerStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' };

const page: CSSProperties = {
  minHeight: '100vh',
  margin: 0,
  padding: 20,
  background: '#0a0a1a',
  color: TEXT,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 16,
  overflowWrap: 'anywhere',
};

const block: CSSProperties = { minWidth: 0 };
const row: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const h2: CSSProperties = { fontSize: 16, color: TEXT, margin: '0 0 8px' };
const linkStyle: CSSProperties = { color: '#a5b4fc', minHeight: 44, display: 'inline-flex', alignItems: 'center' };

const btn: CSSProperties = {
  padding: '8px 12px',
  minHeight: 44,
  background: 'transparent',
  color: TEXT,
  border: '1px solid #64748b',
  borderRadius: 6,
  cursor: 'pointer',
  font: 'inherit',
};

const activeBtn: CSSProperties = { ...btn, background: '#4f46e5', borderColor: '#4f46e5' };
const disabledBtn: CSSProperties = { opacity: 0.5, cursor: 'not-allowed' };
const alertBox: CSSProperties = { border: '1px solid #64748b', borderRadius: 8, padding: 16, color: TEXT };
const th: CSSProperties = { textAlign: 'left', padding: '6px 8px', fontWeight: 400, color: MUTED, borderBottom: `1px solid ${BORDER}` };
const td: CSSProperties = { padding: '6px 8px', color: TEXT };
const tdNum: CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
