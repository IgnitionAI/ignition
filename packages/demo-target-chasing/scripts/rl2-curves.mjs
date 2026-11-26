/**
 * Build-time aggregation of the RL 2 episode logs for the comparison page.
 *
 * The raw `<bench>/<algo>/seed-<n>/episodes.jsonl` files stay the source of truth and
 * are served untouched. This module derives a light `episodes-binned.json` next to each
 * of them: episodes are grouped by the environment step at which they end, in fixed
 * bins of `binSteps` steps, and each bin keeps count, mean, min, max and the episode
 * range. The page draws the per-bin mean and says so in the chart title.
 *
 * Used by vite.config.ts (dev middleware + emitted build assets) and by the tests.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RL2_ALGOS = ['dqn', 'double-dqn'];
export const RL2_BIN_STEPS = 250;
const BINNED_RE = /^\/(.+)\/(dqn|double-dqn)\/seed-(\d+)\/episodes-binned\.json$/;

/** Bins the raw JSONL text. Throws an Error whose message starts with "format:" on a bad line. */
export function binEpisodes(text, { binSteps = RL2_BIN_STEPS, budget }) {
  if (!Number.isInteger(budget) || budget <= 0) throw new Error('format: budget is not a positive integer');
  const nBins = Math.ceil(budget / binSteps);
  const bins = Array.from({ length: nBins }, (_, i) => ({
    start: i * binSteps,
    end: Math.min((i + 1) * binSteps, budget),
    count: 0,
    sum: 0,
    min: null,
    max: null,
    firstEpisode: null,
    lastEpisode: null,
  }));
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  lines.forEach((line, index) => {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      throw new Error(`format: line ${index + 1} is not JSON`);
    }
    for (const key of ['episode', 'return', 'globalStep']) {
      if (typeof row[key] !== 'number' || !Number.isFinite(row[key])) {
        throw new Error(`format: line ${index + 1} has no numeric ${key}`);
      }
    }
    if (row.globalStep < 1 || row.globalStep > budget) {
      throw new Error(`format: line ${index + 1} globalStep ${row.globalStep} is outside the budget`);
    }
    const bin = bins[Math.floor((row.globalStep - 1) / binSteps)];
    bin.count += 1;
    bin.sum += row.return;
    bin.min = bin.min === null ? row.return : Math.min(bin.min, row.return);
    bin.max = bin.max === null ? row.return : Math.max(bin.max, row.return);
    bin.firstEpisode ??= row.episode;
    bin.lastEpisode = row.episode;
  });
  return {
    binSteps,
    budget,
    episodes: lines.length,
    aggregation: 'mean of the returns of the episodes that end inside each bin of binSteps environment steps',
    bins: bins.map(({ sum, ...bin }) => ({ ...bin, mean: bin.count ? sum / bin.count : null })),
  };
}

/** Builds the episodes-binned.json payload for one run directory, or null if the raw log is absent. */
export function binnedPayload(runDir, budget) {
  const rawPath = join(runDir, 'episodes.jsonl');
  if (!existsSync(rawPath)) return null;
  const raw = readFileSync(rawPath);
  const source = {
    path: 'episodes.jsonl',
    bytes: raw.byteLength,
    sha256: createHash('sha256').update(raw).digest('hex'),
  };
  try {
    return { source, ...binEpisodes(raw.toString('utf8'), { budget }) };
  } catch (error) {
    return { source, formatError: error instanceof Error ? error.message : String(error) };
  }
}

function readBudget(benchDir) {
  const manifestPath = join(benchDir, 'manifest.json');
  if (!existsSync(manifestPath)) return null;
  try {
    const budget = JSON.parse(readFileSync(manifestPath, 'utf8'))?.budget?.envStepsPerRun;
    return Number.isInteger(budget) ? budget : null;
  } catch {
    return null;
  }
}

/** Every binned file to emit for the given bench directories (relative to publicDir). */
export function collectBinned(publicDir, benchDirs) {
  const out = [];
  for (const dir of benchDirs) {
    const benchDir = join(publicDir, dir);
    const budget = readBudget(benchDir);
    if (budget === null) continue;
    let seeds = [];
    try {
      seeds = JSON.parse(readFileSync(join(benchDir, 'manifest.json'), 'utf8')).seeds ?? [];
    } catch {
      continue;
    }
    for (const algo of RL2_ALGOS) {
      for (const seed of seeds) {
        const payload = binnedPayload(join(benchDir, algo, `seed-${seed}`), budget);
        if (payload) out.push({ fileName: `${dir}/${algo}/seed-${seed}/episodes-binned.json`, payload });
      }
    }
  }
  return out;
}

/** Vite plugin: serves the binned files in dev and emits them into the build. */
export function rl2CurvesPlugin({ publicDir, benchDirs }) {
  return {
    name: 'rl2-episode-curves',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0].replace(server.config.base.replace(/\/$/, ''), '');
        const match = BINNED_RE.exec(path);
        if (!match || !benchDirs.includes(match[1])) return next();
        const budget = readBudget(join(publicDir, match[1]));
        const payload = budget === null ? null : binnedPayload(join(publicDir, match[1], match[2], `seed-${match[3]}`), budget);
        if (!payload) {
          res.statusCode = 404;
          res.end('not found');
          return;
        }
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(payload));
      });
    },
    generateBundle() {
      for (const { fileName, payload } of collectBinned(publicDir, benchDirs)) {
        this.emitFile({ type: 'asset', fileName, source: JSON.stringify(payload) });
      }
    },
  };
}
