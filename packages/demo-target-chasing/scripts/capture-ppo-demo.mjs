/**
 * Playwright (or playwright-core) captures of the PPO replay page.
 * Uses system Chrome + SwiftShader. PLAYWRIGHT_PATH optional.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const output = process.argv[2] || join(here, '../../../evidence/ign-170/playwright');
mkdirSync(output, { recursive: true });

const require = createRequire(import.meta.url);
const playwrightPath = process.env.PLAYWRIGHT_PATH;
const mod = playwrightPath
  ? await import(pathToFileURL(join(playwrightPath, 'index.mjs')).href)
  : await import(require.resolve('playwright-core'));
const chromium = mod.chromium ?? mod.default?.chromium;

const url = process.env.TARGET_CHASING_URL || 'http://127.0.0.1:4173/ppo.html';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/local/bin/google-chrome',
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const notes = { url, checks: [], errors: [] };
page.on('pageerror', (error) => notes.errors.push(error.message));

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="ppo-chart"], [data-testid="ppo-error"]', { timeout: 30000 });
  const error = await page.locator('[data-testid="ppo-error"]').count();
  if (error) {
    notes.checks.push({ name: 'artifacts missing on main url', text: await page.locator('[data-testid="ppo-error"]').innerText() });
  } else {
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.screenshot({ path: join(output, '01-untrained.png'), fullPage: true });
    notes.checks.push({ name: 'untrained view', policy: await page.locator('[data-testid="ppo-policy"]').innerText() });
    await page.getByTestId('ppo-trained').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(output, '02-trained.png'), fullPage: true });
    notes.checks.push({ name: 'trained view', policy: await page.locator('[data-testid="ppo-policy"]').innerText() });
    await page.getByTestId('ppo-play').click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(output, '03-replay.png'), fullPage: true });
    const renderer = await page.locator('canvas').first().evaluate((canvas) => {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return { renderer: 'no-webgl' };
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        version: gl.getParameter(gl.VERSION),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      };
    });
    notes.renderer = renderer;
  }

  const missingUrl = new URL(url);
  missingUrl.searchParams.set('manifest', '/ppo/does-not-exist.json');
  await page.goto(missingUrl.toString(), { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="ppo-error"]', { timeout: 15000 });
  notes.checks.push({
    name: 'missing checkpoint/log',
    text: await page.locator('[data-testid="ppo-error"]').innerText(),
  });
  await page.screenshot({ path: join(output, '04-missing.png'), fullPage: true });
  writeFileSync(join(output, 'capture.json'), JSON.stringify(notes, null, 2));
  console.log(JSON.stringify(notes, null, 2));
} finally {
  await browser.close();
}
