export interface PpoSeedSummary {
  seed: number;
  improved: boolean;
  firstMean20: number | null;
  lastMean20: number | null;
}

export interface PpoManifest {
  gitSha: string;
  nodeVersion: string;
  selectedSeed: number;
  seeds: number[];
  anyImproved: boolean;
  summaries: PpoSeedSummary[];
  checkpoints: { untrained: string; trained: string };
  logs: { episodesJsonl: string[]; summaries: string[] };
}

export function missingArtifactMessage(url: string, status?: number): string {
  return status === undefined
    ? `PPO checkpoint/log absent: ${url}`
    : `PPO checkpoint/log absent: ${url} (${status})`;
}

export async function fetchJson<T>(url: string, fetchImpl: typeof fetch = fetch): Promise<T> {
  const response = await fetchImpl(url);
  const text = await response.text();
  if (!response.ok || text.trimStart().startsWith('<')) {
    throw new Error(missingArtifactMessage(url, response.status));
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(missingArtifactMessage(url, response.status));
  }
}

export function parseEpisodeReturns(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.some((value) => typeof value !== 'number')) {
    throw new Error('PPO log is not an array of numbers');
  }
  return raw;
}
