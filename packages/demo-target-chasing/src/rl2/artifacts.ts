import { fetchJson, formatPpoNumber, PpoArtifactMissingError } from '../ppo/artifacts';
import { RL2_ALGOS, RL2_BIN_STEPS, type Rl2Algo } from './benches';

// ── Types read from the artifacts ────────────────────────────────────────────

export interface Rl2Manifest {
  gitSha: string;
  algorithms: string[];
  seeds: number[];
  budget: { envStepsPerRun: number };
  gamma: number;
  experiment?: { path: string };
}

export interface Rl2Experiment {
  seeds: number[];
  budget: { envStepsPerRun: number; maxStepsPerEpisode: number };
  agent: {
    hiddenLayers: number[];
    lr: number;
    gamma: number;
    batchSize: number;
    epsilon: number;
    epsilonDecay: number;
    minEpsilon: number;
    targetUpdateFrequency: number;
  };
  rewardNoise?: unknown;
}

export interface Rl2Summary {
  algo: string;
  seed: number;
  envSteps: number;
  episodes: number;
  lastEpisodesCount: number;
  lastMeanReturn: number;
  lastSuccessRate: number;
  greedyEvalMean: number;
  greedySuccessRate: number;
  finalQVsReturn: { meanQMax: number; meanDiscountedReturn: number; meanGap: number };
  meanGapSecondHalf: number;
}

export interface Rl2Bin {
  start: number;
  end: number;
  count: number;
  mean: number | null;
  min: number | null;
  max: number | null;
  firstEpisode: number | null;
  lastEpisode: number | null;
}

export interface Rl2Binned {
  binSteps: number;
  budget: number;
  bins: Rl2Bin[];
}

export interface Rl2QRow {
  step: number;
  meanQMax: number;
  meanDiscountedReturn: number;
}

export type ByRun<T> = Record<Rl2Algo, Record<number, T>>;

export interface Rl2Problem {
  url: string;
  status?: number;
  /** Set when the file was fetched but its content is not what the page expects. */
  format?: string;
}

export type Section<T> = { ok: true; data: T } | { ok: false; problems: Rl2Problem[] };

export interface Rl2BenchData {
  manifestUrl: string;
  dirUrl: string;
  manifest: Rl2Manifest;
  /** experiment.json when readable (also needed for the changed-variable line). */
  experiment: Rl2Experiment | null;
  /** Protocol, summaries, binned curves and raw logs of every run. All or nothing. */
  comparison: Section<{ experiment: Rl2Experiment; summaries: ByRun<Rl2Summary>; binned: ByRun<Rl2Binned> }>;
  /** Q estimate vs observed return of every run. Fails alone. */
  q: Section<ByRun<Rl2QRow[]>>;
}

/** The bench manifest itself is absent or unreadable. */
export class Rl2BenchMissingError extends Error {
  readonly url: string;
  readonly status?: number;
  constructor(url: string, status?: number) {
    super(`RL 2 bench absent: ${url}${status === undefined ? '' : ` (${status})`}`);
    this.name = 'Rl2BenchMissingError';
    this.url = url;
    this.status = status;
  }
}

// ── URLs ─────────────────────────────────────────────────────────────────────

/** URL of `<base><dir>/manifest.json` (`/` locally, `/demos/target-chasing/` on the website). */
export function rl2ManifestUrl(dir: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${dir.replace(/^\/+|\/+$/g, '')}/manifest.json`;
}

/**
 * Optional `?manifest=` override (used to check the error states on a test folder).
 * Only same-origin URLs are accepted; anything else is ignored.
 */
export function manifestOverride(search: string, href: string): string | null {
  const raw = new URLSearchParams(search).get('manifest');
  if (!raw) return null;
  try {
    const url = new URL(raw, href);
    if (url.origin !== new URL(href).origin) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

export function dirOf(manifestUrl: string): string {
  const path = manifestUrl.split('?')[0];
  return path.slice(0, path.lastIndexOf('/') + 1);
}

export function runPath(algo: Rl2Algo, seed: number, file: string): string {
  return `${algo}/seed-${seed}/${file}`;
}

// ── Validation ───────────────────────────────────────────────────────────────

const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNumOrNull = (value: unknown) => value === null || isNum(value);

export function checkManifest(raw: unknown): string | null {
  const m = raw as Partial<Rl2Manifest> | null;
  if (!m || typeof m !== 'object') return 'manifest is not an object';
  if (typeof m.gitSha !== 'string') return 'manifest.gitSha is missing';
  if (!Array.isArray(m.seeds) || m.seeds.length === 0 || !m.seeds.every(isNum)) return 'manifest.seeds is missing';
  if (!Array.isArray(m.algorithms) || !RL2_ALGOS.every((a) => m.algorithms!.includes(a))) {
    return 'manifest.algorithms does not list dqn and double-dqn';
  }
  if (!isNum(m.budget?.envStepsPerRun)) return 'manifest.budget.envStepsPerRun is missing';
  if (!isNum(m.gamma)) return 'manifest.gamma is missing';
  return null;
}

export function checkSummary(raw: unknown): string | null {
  const s = raw as Partial<Rl2Summary> | null;
  if (!s || typeof s !== 'object') return 'summary is not an object';
  for (const key of ['envSteps', 'lastMeanReturn', 'lastSuccessRate', 'greedyEvalMean', 'greedySuccessRate', 'meanGapSecondHalf'] as const) {
    if (!isNum(s[key])) return `summary.${key} is not a number`;
  }
  const f = s.finalQVsReturn;
  if (!f || !isNum(f.meanQMax) || !isNum(f.meanDiscountedReturn) || !isNum(f.meanGap)) {
    return 'summary.finalQVsReturn is not numeric';
  }
  return null;
}

export function checkBinned(raw: unknown, budget: number): string | null {
  const b = raw as (Partial<Rl2Binned> & { formatError?: string }) | null;
  if (!b || typeof b !== 'object') return 'binned log is not an object';
  if (typeof b.formatError === 'string') return b.formatError;
  if (b.binSteps !== RL2_BIN_STEPS) return `binned log uses ${String(b.binSteps)} steps per bin`;
  if (b.budget !== budget) return 'binned log budget differs from the manifest';
  if (!Array.isArray(b.bins) || b.bins.length === 0) return 'binned log has no bins';
  for (const bin of b.bins) {
    if (!isNum(bin.end) || !isNum(bin.count) || !isNumOrNull(bin.mean) || !isNumOrNull(bin.min) || !isNumOrNull(bin.max)) {
      return 'binned log has a non-numeric bin';
    }
  }
  return null;
}

/** Parses q-vs-return.jsonl. Returns rows or a format message (incl. Q fields not logged). */
export function parseQLog(text: string): Rl2QRow[] | string {
  if (text.trimStart().startsWith('<')) return 'not a JSONL log';
  const rows: Rl2QRow[] = [];
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) return 'empty log';
  for (let i = 0; i < lines.length; i++) {
    let row: Record<string, unknown>;
    try {
      row = JSON.parse(lines[i]);
    } catch {
      return `line ${i + 1} is not JSON`;
    }
    const step = row.step ?? row.globalStep;
    if (!isNum(step) || !isNum(row.meanQMax) || !isNum(row.meanDiscountedReturn)) {
      return `line ${i + 1}: Q values not logged (step, meanQMax, meanDiscountedReturn)`;
    }
    rows.push({ step, meanQMax: row.meanQMax, meanDiscountedReturn: row.meanDiscountedReturn });
  }
  return rows;
}

// ── Loading ──────────────────────────────────────────────────────────────────

function problemOf(cause: unknown, url: string): Rl2Problem {
  if (cause instanceof PpoArtifactMissingError) return { url: cause.url, status: cause.status };
  return { url, format: cause instanceof Error ? cause.message : String(cause) };
}

async function fetchChecked<T>(url: string, check: (raw: unknown) => string | null, fetchImpl: typeof fetch): Promise<T> {
  const raw = await fetchJson<unknown>(url, fetchImpl);
  const issue = check(raw);
  if (issue) throw new Error(issue);
  return raw as T;
}

/** HEAD (falls back to GET) that treats an HTML fallback page as a missing file. */
export async function assertPresent(url: string, fetchImpl: typeof fetch): Promise<void> {
  let response = await fetchImpl(url, { method: 'HEAD' });
  if (response.status === 405) response = await fetchImpl(url);
  const type = response.headers.get('content-type') ?? '';
  if (!response.ok || type.includes('text/html')) throw new PpoArtifactMissingError(url, response.status);
}

async function fetchText(url: string, fetchImpl: typeof fetch): Promise<string> {
  const response = await fetchImpl(url);
  const text = await response.text();
  if (!response.ok || text.trimStart().startsWith('<')) throw new PpoArtifactMissingError(url, response.status);
  return text;
}

function emptyByRun<T>(): ByRun<T> {
  return { dqn: {}, 'double-dqn': {} };
}

/**
 * Loads one bench. Throws Rl2BenchMissingError if the manifest is absent or invalid.
 * Every other problem is collected (all of them, not only the first) into the section
 * it blocks: the comparison (protocol, summaries, curves, raw logs) or the Q block.
 */
export async function loadBench(manifestUrl: string, fetchImpl: typeof fetch = fetch): Promise<Rl2BenchData> {
  let manifest: Rl2Manifest;
  try {
    manifest = await fetchJson<Rl2Manifest>(manifestUrl, fetchImpl);
  } catch (cause) {
    const status = cause instanceof PpoArtifactMissingError ? cause.status : undefined;
    throw new Rl2BenchMissingError(manifestUrl, status);
  }
  const manifestIssue = checkManifest(manifest);
  if (manifestIssue) throw new Rl2BenchMissingError(`${manifestUrl} — ${manifestIssue}`);

  const dirUrl = dirOf(manifestUrl);
  const budget = manifest.budget.envStepsPerRun;
  const problems: Rl2Problem[] = [];
  const qProblems: Rl2Problem[] = [];
  const summaries = emptyByRun<Rl2Summary>();
  const binned = emptyByRun<Rl2Binned>();
  const qRows = emptyByRun<Rl2QRow[]>();
  const holder: { experiment: Rl2Experiment | null } = { experiment: null };

  const tasks: Promise<void>[] = [];
  const experimentUrl = dirUrl + (manifest.experiment?.path ?? 'experiment.json');
  tasks.push(
    fetchJson<Rl2Experiment>(experimentUrl, fetchImpl)
      .then((raw) => {
        if (!raw?.agent || !raw?.budget) throw new Error('experiment.json has no agent or budget');
        holder.experiment = raw;
      })
      .catch((cause) => void problems.push(problemOf(cause, experimentUrl))),
  );
  for (const algo of RL2_ALGOS) {
    for (const seed of manifest.seeds) {
      const url = (file: string) => dirUrl + runPath(algo, seed, file);
      tasks.push(
        fetchChecked<Rl2Summary>(url('summary.json'), checkSummary, fetchImpl)
          .then((s) => void (summaries[algo][seed] = s))
          .catch((cause) => void problems.push(problemOf(cause, url('summary.json')))),
        fetchChecked<Rl2Binned>(url('episodes-binned.json'), (raw) => checkBinned(raw, budget), fetchImpl)
          .then((b) => void (binned[algo][seed] = b))
          .catch((cause) => void problems.push(problemOf(cause, url('episodes-binned.json')))),
        assertPresent(url('episodes.jsonl'), fetchImpl).catch(
          (cause) => void problems.push(problemOf(cause, url('episodes.jsonl'))),
        ),
        fetchText(url('q-vs-return.jsonl'), fetchImpl)
          .then((text) => {
            const parsed = parseQLog(text);
            if (typeof parsed === 'string') throw new Error(parsed);
            qRows[algo][seed] = parsed;
          })
          .catch((cause) => void qProblems.push(problemOf(cause, url('q-vs-return.jsonl')))),
      );
    }
  }
  await Promise.all(tasks);

  if (qProblems.length === 0) {
    const reference = JSON.stringify(qRows.dqn[manifest.seeds[0]].map((r) => r.step));
    for (const algo of RL2_ALGOS) {
      for (const seed of manifest.seeds) {
        if (JSON.stringify(qRows[algo][seed].map((r) => r.step)) !== reference) {
          qProblems.push({ url: dirUrl + runPath(algo, seed, 'q-vs-return.jsonl'), format: 'evaluation steps differ between runs' });
        }
      }
    }
  }
  const byUrl = (a: Rl2Problem, b: Rl2Problem) => a.url.localeCompare(b.url);
  const experiment = holder.experiment;
  return {
    manifestUrl,
    dirUrl,
    manifest,
    experiment,
    comparison:
      problems.length || !experiment
        ? { ok: false, problems: problems.sort(byUrl) }
        : { ok: true, data: { experiment, summaries, binned } },
    q: qProblems.length ? { ok: false, problems: qProblems.sort(byUrl) } : { ok: true, data: qRows },
  };
}

// ── Chart data (no smoothing beyond the declared per-bin mean) ────────────────

const PREFIX: Record<Rl2Algo, string> = { dqn: 'dqn', 'double-dqn': 'ddqn' };
export const seriesKey = (algo: Rl2Algo, what: string) => `${PREFIX[algo]}_${what}`;

const meanOf = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length;

export type ChartRow = Record<string, number | [number, number] | null>;

/** One row per bin: per algo the seed mean, the min–max band over seeds and each seed. */
export function returnRows(binned: ByRun<Rl2Binned>, seeds: number[]): ChartRow[] {
  const first = binned.dqn[seeds[0]];
  return first.bins.map((bin, i) => {
    const row: ChartRow = { x: bin.end, start: bin.start };
    for (const algo of RL2_ALGOS) {
      const values: number[] = [];
      let firstEpisode: number | null = null;
      let lastEpisode: number | null = null;
      for (const seed of seeds) {
        const b = binned[algo][seed].bins[i];
        row[seriesKey(algo, `s${seed}`)] = b?.mean ?? null;
        if (b && b.mean !== null) values.push(b.mean);
        if (b?.firstEpisode != null) firstEpisode = Math.min(firstEpisode ?? Infinity, b.firstEpisode);
        if (b?.lastEpisode != null) lastEpisode = Math.max(lastEpisode ?? -Infinity, b.lastEpisode);
      }
      row[seriesKey(algo, 'mean')] = values.length ? meanOf(values) : null;
      row[seriesKey(algo, 'band')] = values.length ? [Math.min(...values), Math.max(...values)] : null;
      row[seriesKey(algo, 'ep0')] = firstEpisode;
      row[seriesKey(algo, 'ep1')] = lastEpisode;
    }
    return row;
  });
}

/** One row per evaluation step: per algo the 3-seed mean of Q, G, the Q–G area and Q − G. */
export function qRows(q: ByRun<Rl2QRow[]>, seeds: number[]): ChartRow[] {
  return q.dqn[seeds[0]].map((ref, i) => {
    const row: ChartRow = { x: ref.step };
    for (const algo of RL2_ALGOS) {
      const qm = meanOf(seeds.map((s) => q[algo][s][i].meanQMax));
      const gm = meanOf(seeds.map((s) => q[algo][s][i].meanDiscountedReturn));
      row[seriesKey(algo, 'q')] = qm;
      row[seriesKey(algo, 'g')] = gm;
      row[seriesKey(algo, 'area')] = [Math.min(qm, gm), Math.max(qm, gm)];
      row[seriesKey(algo, 'gap')] = qm - gm;
    }
    return row;
  });
}

/** Shared Y domain over the given keys of the rows, rounded outwards to `step`. */
export function sharedDomain(rows: ChartRow[], keys: string[], step = 0.1): [number, number] {
  const values: number[] = [];
  for (const row of rows) {
    for (const key of keys) {
      const v = row[key];
      if (typeof v === 'number') values.push(v);
      else if (Array.isArray(v)) values.push(...v);
    }
  }
  if (values.length === 0) return [0, 1];
  const lo = Math.floor(Math.min(...values) / step - 1e-9) * step;
  const hi = Math.ceil(Math.max(...values) / step + 1e-9) * step;
  return [Number(lo.toFixed(6)), Number(hi.toFixed(6))];
}

/**
 * Regular Y ticks (at most 6) covering `domain`: the step is the smallest of
 * 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5 that fits; the domain is widened to whole steps.
 */
export function niceTicks(domain: [number, number]): { domain: [number, number]; ticks: number[]; digits: number } {
  const [lo0, hi0] = domain;
  for (const step of [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5]) {
    const lo = Math.floor(lo0 / step + 1e-9) * step;
    const hi = Math.ceil(hi0 / step - 1e-9) * step;
    const n = Math.round((hi - lo) / step) + 1;
    if (n <= 6) {
      const ticks = Array.from({ length: n }, (_, i) => Number((lo + i * step).toFixed(6)));
      const digits = step < 0.1 || step === 0.25 ? 2 : step < 1 ? 1 : 0;
      return { domain: [ticks[0], ticks[n - 1]], ticks, digits };
    }
  }
  return { domain, ticks: [], digits: 1 };
}

/** Axis label: localized decimals and a true minus sign. */
export function formatAxis(value: number, lang: 'fr' | 'en', digits: number): string {
  const text = formatPpoNumber(Math.abs(value), lang, '', digits);
  return value < 0 && Number(text.replace(',', '.')) !== 0 ? `\u2212${text}` : text;
}

/** At most 5 X ticks: 0, ¼, ½, ¾ and the full budget. */
export function stepTicks(budget: number): number[] {
  return [0, 1, 2, 3, 4].map((i) => Math.round((budget * i) / 4));
}

/** "12,5 k" in French, "12.5 k" in English, "0" for zero. */
export function formatSteps(value: number, lang: 'fr' | 'en'): string {
  if (value === 0) return '0';
  const k = value / 1000;
  const text = Number.isInteger(k) ? String(k) : k.toFixed(1);
  return `${lang === 'fr' ? text.replace('.', ',') : text} k`;
}

export function formatNumber(value: number | null | undefined, lang: 'fr' | 'en', absent: string, digits = 4): string {
  return formatPpoNumber(value, lang, absent, digits);
}

/** Signed number: "+0,0024", "−0,0110" (true minus sign), "0,0000". */
export function formatSigned(value: number | null | undefined, lang: 'fr' | 'en', absent: string, digits = 4): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return absent;
  const rounded = Number(value.toFixed(digits));
  const body = formatPpoNumber(Math.abs(rounded), lang, absent, digits);
  if (rounded > 0) return `+${body}`;
  if (rounded < 0) return `−${body}`;
  return body;
}

export function formatPercent(value: number | null | undefined, lang: 'fr' | 'en', absent: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return absent;
  const text = formatPpoNumber(value * 100, lang, absent, Number.isInteger(value * 100) ? 0 : 1);
  return lang === 'fr' ? `${text} %` : `${text}%`;
}

// ── Reading of the results (computed from the logs, never hard-coded) ────────

export interface Rl2Reading {
  /** Same last-100 mean return and same success rates on every seed for both variants. */
  sameOutcome: boolean;
  /** Ranges of the final Q − G over the seeds overlap between the two variants. */
  gapRangesOverlap: boolean;
  noMeasurableDifference: boolean;
  finalGapMin: number;
  finalGapMax: number;
}

export function readResults(summaries: ByRun<Rl2Summary>, seeds: number[]): Rl2Reading {
  const eq = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const sameOutcome = seeds.every((seed) => {
    const a = summaries.dqn[seed];
    const b = summaries['double-dqn'][seed];
    return eq(a.lastMeanReturn, b.lastMeanReturn) && eq(a.lastSuccessRate, b.lastSuccessRate) && eq(a.greedySuccessRate, b.greedySuccessRate);
  });
  const range = (algo: Rl2Algo) => {
    const gaps = seeds.map((s) => summaries[algo][s].finalQVsReturn.meanGap);
    return [Math.min(...gaps), Math.max(...gaps)];
  };
  const [a0, a1] = range('dqn');
  const [b0, b1] = range('double-dqn');
  const gapRangesOverlap = a0 <= b1 && b0 <= a1;
  return {
    sameOutcome,
    gapRangesOverlap,
    noMeasurableDifference: sameOutcome && gapRangesOverlap,
    finalGapMin: Math.min(a0, b0),
    finalGapMax: Math.max(a1, b1),
  };
}

/** The variable this bench changes, read from experiment.json (null for the control bench). */
export function changedVariable(experiment: Pick<Rl2Experiment, 'rewardNoise'>):
  | null
  | { kind: 'gaussianRewardNoise'; sigma: number }
  | { kind: 'raw'; text: string } {
  const noise = experiment.rewardNoise;
  if (noise === undefined || noise === null || noise === false) return null;
  if (isNum(noise)) return { kind: 'gaussianRewardNoise', sigma: noise };
  if (typeof noise === 'object') {
    const n = noise as Record<string, unknown>;
    const sigma = n.sigma ?? n.std ?? n.stddev;
    const type = String(n.type ?? n.distribution ?? 'gaussian').toLowerCase();
    if (isNum(sigma) && (type.includes('gauss') || type.includes('normal'))) return { kind: 'gaussianRewardNoise', sigma };
  }
  return { kind: 'raw', text: JSON.stringify(noise) };
}

/** Number of train steps for epsilon to go from `epsilon` down to `minEpsilon`. */
export function epsilonSteps(agent: Rl2Experiment['agent']): number {
  return Math.round(Math.log(agent.minEpsilon / agent.epsilon) / Math.log(agent.epsilonDecay));
}

// ── Overestimation reading (declared threshold, computed from q-vs-return) ───

/**
 * Reading threshold, declared here and shown on the page: a run "clearly overestimates"
 * when, at some evaluation point, its mean max_a Q minus the observed discounted
 * return (same fixed starts, same gamma) exceeds this value.
 */
export const OVERESTIMATION_PEAK = 0.05;

export interface Rl2Peak {
  peak: number;
  step: number;
}

/** Highest Q − G of each run over its evaluation points. */
export function peakGaps(q: ByRun<Rl2QRow[]>, seeds: number[]): ByRun<Rl2Peak> {
  const out = { dqn: {}, 'double-dqn': {} } as ByRun<Rl2Peak>;
  for (const algo of RL2_ALGOS) {
    for (const seed of seeds) {
      let best: Rl2Peak = { peak: -Infinity, step: 0 };
      for (const row of q[algo][seed]) {
        const gap = row.meanQMax - row.meanDiscountedReturn;
        if (gap > best.peak) best = { peak: gap, step: row.step };
      }
      out[algo][seed] = best;
    }
  }
  return out;
}

export interface Rl2Overestimation {
  /** Each variant has at least one seed whose peak exceeds the threshold. */
  bothAbove: boolean;
  anyAbove: boolean;
  range: Record<Rl2Algo, [number, number]>;
  peakMin: number;
  peakMax: number;
  /** Largest |peak(dqn) − peak(double-dqn)| at equal seed. */
  betweenVariants: number;
  /** Smallest, over the two variants, of the peak spread across seeds. */
  betweenSeeds: number;
}

export function readOverestimation(q: ByRun<Rl2QRow[]>, seeds: number[], threshold = OVERESTIMATION_PEAK): Rl2Overestimation {
  const peaks = peakGaps(q, seeds);
  const values = (algo: Rl2Algo) => seeds.map((s) => peaks[algo][s].peak);
  const range = {
    dqn: [Math.min(...values('dqn')), Math.max(...values('dqn'))],
    'double-dqn': [Math.min(...values('double-dqn')), Math.max(...values('double-dqn'))],
  } as Record<Rl2Algo, [number, number]>;
  const above = (algo: Rl2Algo) => values(algo).some((v) => v > threshold);
  return {
    bothAbove: above('dqn') && above('double-dqn'),
    anyAbove: above('dqn') || above('double-dqn'),
    range,
    peakMin: Math.min(range.dqn[0], range['double-dqn'][0]),
    peakMax: Math.max(range.dqn[1], range['double-dqn'][1]),
    betweenVariants: Math.max(...seeds.map((s) => Math.abs(peaks.dqn[s].peak - peaks['double-dqn'][s].peak))),
    betweenSeeds: Math.min(range.dqn[1] - range.dqn[0], range['double-dqn'][1] - range['double-dqn'][0]),
  };
}

export type Rl2ReadingKey = 'easy' | 'same' | 'differs' | 'overBoth' | 'overFacts';

/**
 * Which reading sentence the logs support. Never names a winner:
 * - overBoth: both variants peak above the threshold and the gap between variants at
 *   equal seed does not exceed the spread between seeds;
 * - overFacts: some peak is above the threshold but not that pattern: the peaks are listed;
 * - easy / same: same outcome and overlapping final gaps (easy on the control bench);
 * - differs: anything else.
 */
export function chooseReading(isControl: boolean, reading: Rl2Reading, over: Rl2Overestimation | null): Rl2ReadingKey {
  if (over?.anyAbove) return over.bothAbove && over.betweenVariants <= over.betweenSeeds ? 'overBoth' : 'overFacts';
  if (reading.noMeasurableDifference) return isControl ? 'easy' : 'same';
  return 'differs';
}
