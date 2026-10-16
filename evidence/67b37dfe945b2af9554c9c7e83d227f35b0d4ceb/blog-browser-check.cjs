const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

(async () => {
  const browser = await chromium.launch({ headless: false, executablePath: process.env.CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  const base = process.env.BLOG_URL || 'http://localhost:3071';
  const slug = 'ball-thrust-physique-rapier';
  const metrics = { sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), browser: await browser.version(), headless: false, viewport: { width: 1440, height: 1100 }, locales: [], errors: [], warnings: [], cancelledRequests: [] };
  page.on('pageerror', (error) => metrics.errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') metrics.errors.push(message.text());
    if (message.type() === 'warning') metrics.warnings.push(message.text());
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText;
    if (failure === 'net::ERR_ABORTED') {
      metrics.cancelledRequests.push({ url: request.url(), resourceType: request.resourceType() });
      return;
    }
    metrics.errors.push(`${request.url()}: ${failure}`);
  });
  page.on('response', (response) => { if (response.status() >= 400) metrics.errors.push(`${response.status()} ${response.url()}`); });
  try {
    for (const locale of ['fr', 'en']) {
      const listing = await page.goto(`${base}/${locale}/blog`);
      assert.equal(listing.status(), 200);
      await page.locator(`a[href="/${locale}/blog/${slug}"]`).first().click();
      await page.locator(`article[lang="${locale}"] h1`).waitFor();
      const title = await page.locator('h1').innerText();
      assert.equal(title, locale === 'fr' ? 'Ball Thrust 3D : la physique avant l’apprentissage' : 'Ball Thrust 3D: physics before learning');
      await page.waitForFunction((expected) => document.title.includes(expected), title);
      assert((await page.locator('article').innerText()).includes(locale === 'fr' ? 'sans réseau de neurones' : 'no neural network'));
      assert((await page.locator('pre').allTextContents()).some((text) => text.includes('export function populateWorld') && text.includes('ball.applyImpulse')));
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('article img'));
        return images.length === 2 && images.every((image) => image.complete && image.naturalWidth > 0);
      });
      await page.screenshot({ path: path.join(__dirname, `blog-${locale}-header.png`) });
      await page.screenshot({ path: path.join(__dirname, `blog-${locale}.png`), fullPage: true });
      const images = await page.locator('article img').evaluateAll((items) => items.map((image) => ({ src: image.getAttribute('src'), alt: image.alt, width: image.naturalWidth })));
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await page.screenshot({ path: path.join(__dirname, `blog-${locale}-narrow.png`), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1100 });
      await page.getByRole('link', { name: locale === 'fr' ? /Essayer Ball Thrust/ : /Try Ball Thrust/ }).click();
      await page.waitForFunction(() => parseFloat(document.querySelector('[data-testid="time"]')?.textContent) > 0.3);
      const initial = await page.getByTestId('position').innerText();
      await page.getByRole('region', { name: /Arène/ }).focus();
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(700); await page.keyboard.up('ArrowRight');
      const moving = await page.getByTestId('position').innerText();
      assert.notEqual(moving, initial);
      await page.getByRole('button', { name: /Réinitialiser/ }).click();
      await page.waitForTimeout(500);
      assert.equal(await page.getByTestId('position').innerText(), initial);
      metrics.locales.push({ locale, title, listingStatus: listing.status(), articleUrl: `${base}/${locale}/blog/${slug}`, images, demoUrl: page.url(), initial, moving, resetMatches: true, narrowLayout: '390 × 844, no horizontal overflow' });
    }
    assert.deepEqual(metrics.errors, []);
    metrics.passed = true;
  } finally {
    fs.writeFileSync(path.join(__dirname, 'blog-browser-metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
    await browser.close();
  }
  console.log(JSON.stringify(metrics, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
