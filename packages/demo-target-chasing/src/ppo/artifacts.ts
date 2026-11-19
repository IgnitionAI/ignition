export interface PpoSeedSummary {
  seed: number;
  improved: boolean;
  firstMean20: number | null;
  lastMean20: number | null;
  untrainedGreedyEvalMean?: number | null;
  greedyEvalMean?: number | null;
  greedyGap?: number | null;
  untrainedGreedyReturnAt02?: number | null;
  trainedGreedyReturnAt02?: number | null;
}

export interface PpoManifest {
  gitSha: string;
  nodeVersion: string;
  selectedSeed: number;
  seeds: number[];
  anyImproved: boolean;
  selection?: string;
  summaries: PpoSeedSummary[];
  checkpoints: { untrained: string; trained: string };
  logs: { episodesJsonl: string[]; summaries: string[] };
}

export function formatPpoReturn(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'absent';
  return value.toFixed(4);
}

/**
 * Locale-aware display of a return: fixed digits, comma decimal separator in French,
 * `absentLabel` when the value is missing.
 */
export function formatPpoNumber(
  value: number | null | undefined,
  lang: 'fr' | 'en',
  absentLabel: string,
  digits = 4,
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return absentLabel;
  const fixed = value.toFixed(digits);
  return lang === 'fr' ? fixed.replace('.', ',') : fixed;
}

/**
 * URL of a file under `public/ppo/`, resolved against the Vite base
 * (`/` locally, `/demos/target-chasing/` on the website).
 */
export function ppoArtifactUrl(path = '', base: string = import.meta.env.BASE_URL ?? '/'): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const rest = path.replace(/^\/+/, '');
  return rest ? `${prefix}ppo/${rest}` : `${prefix}ppo`;
}

export function missingArtifactMessage(url: string, status?: number): string {
  return status === undefined
    ? `PPO checkpoint/log absent: ${url}`
    : `PPO checkpoint/log absent: ${url} (${status})`;
}

/** A checkpoint or log could not be fetched; the UI localizes it from `url` and `status`. */
export class PpoArtifactMissingError extends Error {
  readonly url: string;
  readonly status?: number;

  constructor(url: string, status?: number) {
    super(missingArtifactMessage(url, status));
    this.name = 'PpoArtifactMissingError';
    this.url = url;
    this.status = status;
  }
}

/** A log file was fetched but is not an array of numbers. */
export class PpoLogFormatError extends Error {
  constructor() {
    super('PPO log is not an array of numbers');
    this.name = 'PpoLogFormatError';
  }
}

export async function fetchJson<T>(url: string, fetchImpl: typeof fetch = fetch): Promise<T> {
  const response = await fetchImpl(url);
  const text = await response.text();
  if (!response.ok || text.trimStart().startsWith('<')) {
    throw new PpoArtifactMissingError(url, response.status);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PpoArtifactMissingError(url, response.status);
  }
}

export function parseEpisodeReturns(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.some((value) => typeof value !== 'number')) {
    throw new PpoLogFormatError();
  }
  return raw;
}
