/**
 * Playwright captures and DOM checks of the RL 2 page (DQN vs Double DQN).
 * Usage: RL2_URL=http://127.0.0.1:4174/dqn-vs-double.html node scripts/capture-rl2-demo.mjs <outDir>
 * Error states use same-origin test folders through ?manifest= (see RL2_ERROR_CASES).
 * Writes PNG captures and checks.json into <outDir> (default .scratch/rl2-captures).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const output = process.argv[2] || join(here, '../../../.scratch/rl2-captures');
mkdirSync(output, { recursive: true });
const require = createRequire(import.meta.url);
const mod = process.env.PLAYWRIGHT_PATH
  ? await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH, 'index.mjs')).href)
  : await import(require.resolve('playwright-core'));
const chromium = mod.chromium ?? mod.default?.chromium;
const url = process.env.RL2_URL || 'http://127.0.0.1:4174/dqn-vs-double.html';
const errorCases = JSON.parse(process.env.RL2_ERROR_CASES || '[]');

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const report = { url, views: [], errorCases: [], pageErrors: [] };

async function measure(page) {
  return page.evaluate(() => {
    const px = (el, prop) => getComputedStyle(el)[prop];
    const buttons = [...document.querySelectorAll('button')].map((b) => ({ text: b.textContent, height: b.getBoundingClientRect().height }));
    const xTicks = [...document.querySelectorAll('[data-testid^="rl2-chart"] .recharts-xAxis .recharts-cartesian-axis-tick')]
      .map((t) => t.closest('.recharts-wrapper'))
      .reduce((m, w) => m.set(w, (m.get(w) ?? 0) + 1), new Map());
    const strokes = [...document.querySelectorAll('.recharts-line path.recharts-curve')].map((p) => ({
      stroke: p.getAttribute('stroke'),
      width: p.getAttribute('stroke-width'),
      opacity: p.getAttribute('stroke-opacity'),
      dash: p.getAttribute('stroke-dasharray'),
    }));
    const panels = ['dqn', 'double'].map((id) => {
      const el = document.querySelector(`[data-testid="rl2-panel-${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { id, x: r.x, y: r.y, width: r.width, height: r.height, borderTop: px(el, 'borderTopColor') };
    });
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyBg: px(document.querySelector('#root > div'), 'backgroundColor'),
      color: px(document.querySelector('#root > div'), 'color'),
      font: px(document.querySelector('#root > div'), 'fontFamily'),
      h1: { size: px(document.querySelector('h1'), 'fontSize'), weight: px(document.querySelector('h1'), 'fontWeight') },
      minButtonHeight: Math.min(...buttons.map((b) => b.height)),
      buttons,
      xTicksPerChart: [...xTicks.values()],
      strokes,
      panels,
      hasTable: !!document.querySelector('[data-testid="rl2-table"] table'),
      cards: document.querySelectorAll('[data-testid^="rl2-card-"]').length,
      testids: [...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')),
      text: document.body.innerText,
    };
  });
}

async function view(name, width, lang, target = url) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.on('pageerror', (e) => report.pageErrors.push(`${name}: ${e.message}`));
  await page.addInitScript((l) => localStorage.setItem('lang', l), lang);
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="rl2-chart-returns"], [data-testid="rl2-error"], [data-testid="rl2-bench-error"]', { timeout: 60000 });
  await page.waitForTimeout(1500);
  return page;
}

for (const [width, tag] of [[1440, 'desktop'], [390, 'mobile']]) {
  for (const lang of ['fr', 'en']) {
    const page = await view(`${tag}-${lang}`, width, lang);
    const before = await measure(page);
    await page.screenshot({ path: join(output, `rl2-${tag}-${lang}.png`), fullPage: true });
    const play = page.locator('[data-testid="rl2-play"]');
    let after = null;
    if (await play.isEnabled()) {
      await play.click();
      await page.waitForTimeout(25 * 120 + 800);
      after = await page.evaluate(() => ['dqn', 'double'].map((id) => document.querySelector(`[data-testid="rl2-status-${id}"]`)?.textContent));
      await page.locator('[data-testid="rl2-replay"]').screenshot({ path: join(output, `rl2-${tag}-${lang}-replay-done.png`) });
    }
    if (tag === 'desktop' && lang === 'fr') {
      await page.locator('[data-testid="rl2-bench-target-chasing-noisy"]').click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(output, `rl2-${tag}-${lang}-noisy-bench.png`), fullPage: true });
      report.noisyBench = (await page.locator('[data-testid="rl2-bench-error"]').count()) ? 'bench-error' : 'loaded';
    }
    const { text, ...rest } = before;
    report.views.push({ name: `${tag}-${lang}`, ...rest, rawKeysVisible: /\brl2\.[a-z]/.test(text), statusAfterPlay: after });
    await page.close();
  }
}

for (const c of errorCases) {
  const page = await view(c.name, 1440, 'fr', `${url}?manifest=${encodeURIComponent(c.manifest)}`);
  await page.screenshot({ path: join(output, `rl2-error-${c.name}.png`), fullPage: true });
  const m = await measure(page);
  report.errorCases.push({ name: c.name, testids: m.testids.filter((id) => /error|chart|table|play-disabled|panel/.test(id)), alerts: await page.locator('[role="alert"]').allInnerTexts() });
  await page.close();
}

await browser.close();
writeFileSync(join(output, 'checks.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ output, views: report.views.map((v) => ({ name: v.name, scrollWidth: v.scrollWidth, innerWidth: v.innerWidth, minButtonHeight: v.minButtonHeight, xTicksPerChart: v.xTicksPerChart, cards: v.cards, hasTable: v.hasTable, rawKeysVisible: v.rawKeysVisible, statusAfterPlay: v.statusAfterPlay })), noisyBench: report.noisyBench, errorCases: report.errorCases.map((c) => ({ name: c.name, testids: c.testids })), pageErrors: report.pageErrors }, null, 2));
