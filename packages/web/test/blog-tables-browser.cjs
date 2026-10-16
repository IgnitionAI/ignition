const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

(async () => {
  const output = path.resolve(process.argv[2] || '.scratch/blog-table-fix');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: false, executablePath: process.env.CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  const base = process.env.BLOG_URL || 'http://localhost:3071';
  const metrics = { sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), browser: await browser.version(), checks: [], errors: [] };
  page.on('pageerror', (error) => metrics.errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') metrics.errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) metrics.errors.push(`${response.status()} ${response.url()}`); });
  try {
    for (const locale of ['fr', 'en']) {
      assert.equal((await page.goto(`${base}/${locale}/blog/ball-thrust-physique-rapier`)).status(), 200);
      const table = page.getByRole('table');
      await table.waitFor();
      assert.equal(await table.count(), 1);
      assert.deepEqual(await table.locator('thead th').allTextContents(), locale === 'fr' ? ['Commande', 'Effet'] : ['Control', 'Effect']);
      assert.equal(await table.locator('tbody tr').count(), 6);
      assert.equal(await table.locator('tbody td').count(), 12);
      assert(!(await page.locator('article p').allTextContents()).some((text) => /^\|/.test(text)));
      assert(await page.locator('[data-rehype-pretty-code-figure]').count() > 0);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
        await table.scrollIntoViewIfNeeded();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        await table.screenshot({ path: path.join(output, `table-${locale}-${width}.png`) });
        metrics.checks.push({ locale, width, headers: await table.locator('thead th').allTextContents(), rows: 6, cells: 12, overflow: false });
      }
      await page.setViewportSize({ width: 1440, height: 1100 });
      assert.equal((await page.goto(`${base}/${locale}/blog/premier-agent-cartpole`)).status(), 200);
      await page.locator('article h1').waitFor();
      assert((await page.locator('article h1').innerText()).includes('CartPole'));
      assert(await page.locator('[data-rehype-pretty-code-figure]').count() > 0);
    }
    assert.deepEqual(metrics.errors, []);
    metrics.passed = true;
  } finally {
    fs.writeFileSync(path.join(output, 'tables-browser-metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
    await browser.close();
  }
  console.log(JSON.stringify(metrics, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
