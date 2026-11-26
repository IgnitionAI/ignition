import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  changedVariable,
  chooseReading,
  OVERESTIMATION_PEAK,
  readOverestimation,
  formatAxis,
  formatPercent,
  niceTicks,
  formatSigned,
  formatSteps,
  loadBench,
  manifestOverride,
  parseQLog,
  qRows,
  readResults,
  returnRows,
  rl2ManifestUrl,
  Rl2BenchMissingError,
  seriesKey,
  sharedDomain,
  stepTicks,
} from '../src/rl2/artifacts';
import { RL2_BENCHES, RL2_BIN_STEPS, RL2_CONTROL_BENCH } from '../src/rl2/benches';
import { binEpisodes, binnedPayload, RL2_BIN_STEPS as SCRIPT_BIN_STEPS } from '../scripts/rl2-curves.mjs';
import fr from '../src/locales/fr.json';
import en from '../src/locales/en.json';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '../public');
const CONTROL = '/dqn-vs-double/manifest.json';

/**
 * fetch served from public/ like the built site: episodes-binned.json is derived on the
 * fly (same code as the build), `remove` simulates a missing file, `override` a bad one.
 * A missing file returns the HTML fallback with 200, like a SPA host.
 */
function siteFetch({ remove = [] as string[], override = {} as Record<string, string> } = {}): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const path = url.split('?')[0];
    const html = () => new Response('<!doctype html><html></html>', { status: 200, headers: { 'content-type': 'text/html' } });
    if (remove.includes(path)) return html();
    if (path in override) return new Response(override[path], { status: 200, headers: { 'content-type': 'application/json' } });
    const file = join(publicDir, path);
    if (path.endsWith('/episodes-binned.json')) {
      const runDir = dirname(file);
      if (remove.includes(path.replace('episodes-binned.json', 'episodes.jsonl'))) return new Response('not found', { status: 404 });
      const budget = JSON.parse(readFileSync(join(runDir, '../../manifest.json'), 'utf8')).budget.envStepsPerRun;
      const payload = binnedPayload(runDir, budget);
      return payload ? new Response(JSON.stringify(payload), { status: 200 }) : new Response('not found', { status: 404 });
    }
    if (!existsSync(file)) return new Response('not found', { status: 404 });
    if (init?.method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-type': 'application/octet-stream' } });
    return new Response(readFileSync(file), { status: 200 });
  }) as typeof fetch;
}

describe('RL 2 benches', () => {
  it('lists the control bench first, then the noisy-reward bench', () => {
    expect(RL2_BENCHES.map((b) => b.id)).toEqual(['target-chasing', 'target-chasing-noisy']);
    expect(RL2_BENCHES[0].id).toBe(RL2_CONTROL_BENCH);
  });

  it('resolves manifests under the website demo route', () => {
    expect(rl2ManifestUrl('dqn-vs-double', '/')).toBe(CONTROL);
    expect(rl2ManifestUrl('dqn-vs-double-noisy', '/demos/target-chasing/')).toBe('/demos/target-chasing/dqn-vs-double-noisy/manifest.json');
  });

  it('accepts only a same-origin ?manifest= override', () => {
    const href = 'https://ignitionai.dev/demos/target-chasing/dqn-vs-double.html';
    expect(manifestOverride('?manifest=/demos/target-chasing/test-a/manifest.json', href)).toBe('/demos/target-chasing/test-a/manifest.json');
    expect(manifestOverride('?manifest=https://evil.example/m.json', href)).toBeNull();
    expect(manifestOverride('', href)).toBeNull();
  });

  it('uses the same bin width in the page and in the build helper', () => {
    expect(SCRIPT_BIN_STEPS).toBe(RL2_BIN_STEPS);
  });
});

describe('RL 2 control bench, read from the committed logs', () => {
  it('loads comparison and Q sections for both variants and every seed', async () => {
    const bench = await loadBench(CONTROL, siteFetch());
    expect(bench.comparison.ok).toBe(true);
    expect(bench.q.ok).toBe(true);
    expect(bench.experiment?.rewardNoise).toBeUndefined();
    if (!bench.comparison.ok || !bench.q.ok) return;
    const seeds = bench.manifest.seeds;
    expect(seeds).toEqual([11, 29, 47]);

    const rows = returnRows(bench.comparison.data.binned, seeds);
    expect(rows).toHaveLength(bench.manifest.budget.envStepsPerRun / RL2_BIN_STEPS);
    for (const row of rows) {
      for (const prefix of ['dqn', 'double-dqn'] as const) {
        const band = row[seriesKey(prefix, 'band')] as [number, number] | null;
        const mean = row[seriesKey(prefix, 'mean')] as number | null;
        if (band && mean !== null) {
          expect(band[0]).toBeLessThanOrEqual(mean + 1e-12);
          expect(mean).toBeLessThanOrEqual(band[1] + 1e-12);
        }
      }
    }
    const q = qRows(bench.q.data, seeds);
    expect(q[0].x).toBe(0);
    expect(q.at(-1)!.x).toBe(bench.manifest.budget.envStepsPerRun);
    const [lo, hi] = sharedDomain(q, ['dqn_q', 'dqn_g', 'ddqn_q', 'ddqn_g']);
    for (const row of q) for (const k of ['dqn_q', 'dqn_g', 'ddqn_q', 'ddqn_g']) {
      expect(row[k] as number).toBeGreaterThanOrEqual(lo);
      expect(row[k] as number).toBeLessThanOrEqual(hi);
    }
    // Reading computed from the logs (the page never hard-codes it).
    const reading = readResults(bench.comparison.data.summaries, seeds);
    expect(reading.sameOutcome).toBe(true);
    expect(reading.noMeasurableDifference).toBe(true);
    expect(reading.finalGapMax).toBeLessThan(0);
  });

  it('binned curves keep every episode of the raw log', () => {
    const runDir = join(publicDir, 'dqn-vs-double/dqn/seed-11');
    const raw = readFileSync(join(runDir, 'episodes.jsonl'), 'utf8');
    const lines = raw.trim().split('\n').map((l) => JSON.parse(l));
    const binned = binEpisodes(raw, { budget: 50000 });
    expect(binned.episodes).toBe(lines.length);
    expect(binned.bins.reduce((s: number, b: { count: number }) => s + b.count, 0)).toBe(lines.length);
    const firstBin = lines.filter((l) => l.globalStep <= RL2_BIN_STEPS);
    expect(binned.bins[0].mean).toBeCloseTo(firstBin.reduce((s, l) => s + l.return, 0) / firstBin.length, 12);
    expect(binnedPayload(runDir, 50000).source.path).toBe('episodes.jsonl');
  });

  it('flags a malformed raw line instead of drawing it', () => {
    expect(() => binEpisodes('{"episode":1,"return":"x","globalStep":3}\n', { budget: 100 })).toThrow(/^format:/);
  });
});

describe('RL 2 error states', () => {
  const run = (algo: string, seed: number, file: string) => `/dqn-vs-double/${algo}/seed-${seed}/${file}`;

  it('a missing raw journal blocks the whole comparison and lists every missing file', async () => {
    const remove = [run('double-dqn', 29, 'episodes.jsonl'), run('dqn', 47, 'summary.json')];
    const bench = await loadBench(CONTROL, siteFetch({ remove }));
    expect(bench.comparison.ok).toBe(false);
    if (bench.comparison.ok) return;
    const urls = bench.comparison.problems.map((p) => p.url);
    expect(urls).toEqual(expect.arrayContaining([...remove, run('double-dqn', 29, 'episodes-binned.json')]));
    expect(bench.q.ok).toBe(true);
  });

  it('a missing q-vs-return blocks only the Q section', async () => {
    const bench = await loadBench(CONTROL, siteFetch({ remove: [run('dqn', 11, 'q-vs-return.jsonl')] }));
    expect(bench.comparison.ok).toBe(true);
    expect(bench.q.ok).toBe(false);
    if (!bench.q.ok) expect(bench.q.problems[0].url).toBe(run('dqn', 11, 'q-vs-return.jsonl'));
  });

  it('Q fields absent from the log put the Q section alone in error, with no substitute', async () => {
    const path = run('double-dqn', 47, 'q-vs-return.jsonl');
    const bench = await loadBench(CONTROL, siteFetch({ override: { [path]: '{"step":0,"meanGap":0}\n' } }));
    expect(bench.comparison.ok).toBe(true);
    expect(bench.q.ok).toBe(false);
    if (!bench.q.ok) expect(bench.q.problems[0].format).toMatch(/Q values not logged/);
    expect(parseQLog('<html>')).toBe('not a JSONL log');
  });

  it('a non-numeric summary is a format problem, not a value', async () => {
    const path = run('dqn', 11, 'summary.json');
    const bench = await loadBench(CONTROL, siteFetch({ override: { [path]: '{"envSteps":"lots"}' } }));
    expect(bench.comparison.ok).toBe(false);
    if (!bench.comparison.ok) expect(bench.comparison.problems).toEqual([expect.objectContaining({ url: path, format: expect.stringMatching(/not a number/) })]);
  });

  it('an absent bench (or HTML fallback) is a missing-bench error, not a broken page', async () => {
    const error = await loadBench('/dqn-vs-double-absent/manifest.json', siteFetch()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Rl2BenchMissingError);
    expect((error as Rl2BenchMissingError).url).toBe('/dqn-vs-double-absent/manifest.json');
    const fallback = await loadBench(CONTROL, siteFetch({ remove: [CONTROL] })).catch((e: unknown) => e);
    expect(fallback).toBeInstanceOf(Rl2BenchMissingError);
  });
});

describe('RL 2 display helpers', () => {
  it('formats steps, signed gaps and rates per language', () => {
    expect(formatSteps(12500, 'fr')).toBe('12,5 k');
    expect(formatSteps(12500, 'en')).toBe('12.5 k');
    expect(formatSteps(0, 'fr')).toBe('0');
    expect(formatSigned(-0.0110577, 'fr', 'absent')).toBe('−0,0111');
    expect(formatSigned(0.0024, 'en', 'absent')).toBe('+0.0024');
    expect(formatSigned(-0.00001, 'en', 'absent')).toBe('0.0000');
    expect(formatPercent(1, 'fr', 'absent')).toBe('100 %');
    expect(formatPercent(0.9965, 'en', 'absent')).toBe('99.7%');
  });

  it('uses regular Y ticks with a true minus sign', () => {
    expect(niceTicks([-0.8, 0.9])).toEqual({ domain: [-1, 1], ticks: [-1, -0.5, 0, 0.5, 1], digits: 1 });
    expect(niceTicks([0, 0.9]).ticks).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(formatAxis(-0.5, 'fr', 1)).toBe('\u22120,5');
    expect(formatAxis(0, 'en', 1)).toBe('0.0');
  });

  it('never shows more than 5 X ticks', () => {
    expect(stepTicks(50000)).toEqual([0, 12500, 25000, 37500, 50000]);
  });

  it('reads the changed variable from experiment.json', () => {
    expect(changedVariable({})).toBeNull();
    expect(changedVariable({ rewardNoise: 0.1 })).toEqual({ kind: 'gaussianRewardNoise', sigma: 0.1 });
    expect(changedVariable({ rewardNoise: { type: 'gaussian', mean: 0, sigma: 0.2 } })).toEqual({ kind: 'gaussianRewardNoise', sigma: 0.2 });
    expect(changedVariable({ rewardNoise: { kind: 'other' } })).toMatchObject({ kind: 'raw' });
  });

  it('has the rl2 strings in both languages with the same keys', () => {
    const keys = (obj: object, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
    expect(keys(fr.rl2)).toEqual(keys(en.rl2));
    for (const b of RL2_BENCHES) expect((fr.rl2.bench as Record<string, string>)[b.id]).toBeTruthy();
  });
});

describe('RL 2 noisy-reward bench, read from the committed logs', () => {
  const NOISY = '/dqn-vs-double-noisy/manifest.json';

  it('loads, shows the changed variable and draws the true return', async () => {
    const bench = await loadBench(NOISY, siteFetch());
    expect(bench.comparison.ok).toBe(true);
    expect(bench.q.ok).toBe(true);
    expect(changedVariable(bench.experiment!)).toEqual({ kind: 'gaussianRewardNoise', sigma: 0.5 });
    const raw = readFileSync(join(publicDir, 'dqn-vs-double-noisy/dqn/seed-11/episodes.jsonl'), 'utf8');
    const lines = raw.trim().split('\n').map((l) => JSON.parse(l));
    expect(lines[0]).toHaveProperty('noisyReturn');
    const first = lines.filter((l) => l.globalStep <= RL2_BIN_STEPS);
    const binned = binEpisodes(raw, { budget: 50000 });
    expect(binned.bins[0].mean).toBeCloseTo(first.reduce((s, l) => s + l.return, 0) / first.length, 12);
  });

  it('reads clear overestimation for both variants, without a winner', async () => {
    const bench = await loadBench(NOISY, siteFetch());
    if (!bench.comparison.ok || !bench.q.ok) throw new Error('bench incomplete');
    const seeds = bench.manifest.seeds;
    const over = readOverestimation(bench.q.data, seeds);
    expect(over.bothAbove).toBe(true);
    expect(over.peakMin).toBeGreaterThan(OVERESTIMATION_PEAK);
    expect(over.peakMax).toBeGreaterThan(2);
    expect(over.betweenVariants).toBeLessThanOrEqual(over.betweenSeeds);
    const reading = readResults(bench.comparison.data.summaries, seeds);
    expect(chooseReading(false, reading, over)).toBe('overBoth');
  });

  it('keeps the easy-task reading on the control bench', async () => {
    const bench = await loadBench(CONTROL, siteFetch());
    if (!bench.comparison.ok || !bench.q.ok) throw new Error('bench incomplete');
    const over = readOverestimation(bench.q.data, bench.manifest.seeds);
    expect(over.anyAbove).toBe(false);
    expect(chooseReading(true, readResults(bench.comparison.data.summaries, bench.manifest.seeds), over)).toBe('easy');
  });

  it('lists the peaks instead of concluding when only one variant peaks, or variants differ more than seeds', () => {
    const rows = (peak: number) => [{ step: 0, meanQMax: 0, meanDiscountedReturn: 0 }, { step: 1, meanQMax: peak, meanDiscountedReturn: 0 }];
    const q = (a: number[], b: number[]) => ({
      dqn: { 1: rows(a[0]), 2: rows(a[1]) },
      'double-dqn': { 1: rows(b[0]), 2: rows(b[1]) },
    });
    const same = { sameOutcome: true, gapRangesOverlap: true, noMeasurableDifference: true, finalGapMin: 0, finalGapMax: 0 };
    expect(chooseReading(true, same, readOverestimation(q([0.5, 0.4], [0.01, 0.02]), [1, 2]))).toBe('overFacts');
    expect(chooseReading(true, same, readOverestimation(q([1.0, 1.1], [0.2, 0.25]), [1, 2]))).toBe('overFacts');
    expect(chooseReading(true, same, readOverestimation(q([0.01, 0.02], [0.03, 0.01]), [1, 2]))).toBe('easy');
    expect(chooseReading(true, same, null)).toBe('easy');
    expect(chooseReading(false, { ...same, sameOutcome: false, noMeasurableDifference: false }, null)).toBe('differs');
  });
});
