// Uses an existing Playwright installation; no browser dependency added to the demo.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const output = path.resolve(process.argv[2] || '.scratch/ball-thrust-browser');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false, executablePath: process.env.CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  const consoleMessages = [];
  const errors = [];
  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() });
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  const metrics = { sha: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(), browser: await browser.version(), viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1, headless: false, checks: [] };
  const read = () => page.evaluate(() => {
    const text = (id) => document.querySelector(`[data-testid="${id}"]`).textContent;
    return { position: text('position').split(',').map(Number), velocity: text('velocity').split(',').map(Number), elapsed: parseFloat(text('time')), speed: parseFloat(text('speed')), distance: parseFloat(text('distance')) };
  });
  const focus = () => page.getByRole('region', { name: /Arène/ }).focus();
  const reset = async (seed = 70) => {
    await page.getByLabel('Graine du monde').fill(String(seed));
    await page.getByRole('button', { name: /Réinitialiser/ }).click();
    await page.waitForFunction(() => parseFloat(document.querySelector('[data-testid="time"]').textContent) < 0.4);
    await page.waitForTimeout(400);
    await focus();
  };
  const held = new Set();
  const control = async (wanted) => {
    for (const key of held) if (!wanted.includes(key)) { await page.keyboard.up(key); held.delete(key); }
    for (const key of wanted) if (!held.has(key)) { await page.keyboard.down(key); held.add(key); }
  };
  // Feedback reads only the visible HUD; all movement goes through real keyboard impulses.
  const driveTo = async (x, z, tolerance = 0.22) => {
    const deadline = Date.now() + 14000;
    while (Date.now() < deadline) {
      const state = await read();
      if (Math.hypot(x - state.position[0], z - state.position[2]) < tolerance && state.speed < 0.45) { await control([]); return state; }
      const wanted = [];
      for (const [axis, target, negative, positive] of [[0, x, 'ArrowLeft', 'ArrowRight'], [2, z, 'ArrowUp', 'ArrowDown']]) {
        const signal = 2.8 * (target - state.position[axis]) - 1.9 * state.velocity[axis];
        if (Math.abs(signal) > 0.25) wanted.push(signal < 0 ? negative : positive);
      }
      await control(wanted);
      await page.waitForTimeout(80);
    }
    throw new Error(`Could not reach ${x},${z}: ${JSON.stringify(await read())}`);
  };
  try {
    await page.goto(process.env.BALL_THRUST_URL || 'http://127.0.0.1:4170/');
    await page.waitForFunction(() => parseFloat(document.querySelector('[data-testid="time"]')?.textContent) > 0.3);
    metrics.renderer = await page.locator('canvas').evaluate((canvas) => {
      const gl = canvas.getContext('webgl2');
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return { version: gl.getParameter(gl.VERSION), renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
    });
    const initial = await read();
    await page.screenshot({ path: path.join(output, '01-initial.png'), fullPage: true });
    await focus();
    await control(['ArrowRight']); await page.waitForTimeout(650);
    const moving = await read();
    await control(['ArrowRight', 'Space']); await page.waitForTimeout(1000);
    const noop = await read(); await control([]);
    metrics.checks.push({ name: 'impulse and space no-op preserve inertia', initial, moving, noop });
    assert(moving.position[0] > initial.position[0] + 0.3);
    assert(noop.position[0] > moving.position[0] && noop.speed < moving.speed);

    for (let index = 0; index < 3; index++) {
      await reset(); const state = await read();
      assert.deepEqual(state.position, initial.position); assert(state.speed < 0.01 && state.elapsed < 1);
    }
    await reset(71); assert.notDeepEqual((await read()).position, initial.position);
    await reset(); metrics.checks.push({ name: 'three same-seed resets and different-seed reset', passed: true });
    for (const keys of [['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight'], ['ArrowUp', 'ArrowLeft'], ['ArrowUp', 'ArrowRight'], ['ArrowDown', 'ArrowLeft'], ['ArrowDown', 'ArrowRight']]) {
      await reset(); await control(keys); await page.waitForTimeout(250);
      const state = await read(); await control([]);
      if (keys.includes('ArrowLeft')) assert(state.velocity[0] < -0.1);
      if (keys.includes('ArrowRight')) assert(state.velocity[0] > 0.1);
      if (keys.includes('ArrowUp')) assert(state.velocity[2] < -0.1);
      if (keys.includes('ArrowDown')) assert(state.velocity[2] > 0.1);
    }
    metrics.checks.push({ name: 'all eight keyboard directions', passed: true });

    await reset(); await driveTo(-3.5, 1.4);
    await control(['ArrowRight']); let maxX = -Infinity; let rebounded = false;
    for (let index = 0; index < 25; index++) {
      await page.waitForTimeout(80); const state = await read();
      maxX = Math.max(maxX, state.position[0]); rebounded ||= state.velocity[0] < -0.1;
    }
    await control([]); assert(maxX <= -2.61 && rebounded);
    metrics.checks.push({ name: 'obstacle-a blocks and rebounds', maxX, rebounded });
    await page.screenshot({ path: path.join(output, '02-collision.png'), fullPage: true });
    await reset(); await control(['ArrowLeft']); await page.waitForTimeout(2500); await control([]);
    assert((await read()).position[0] >= -5.68);
    metrics.checks.push({ name: 'west wall contains sphere', state: await read() });

    await reset(); await driveTo(-4.3, -4.1); await driveTo(4.3, -4.1, 0.4);
    await page.getByRole('status').filter({ hasText: 'Cible atteinte' }).waitFor();
    metrics.checks.push({ name: 'goal reached by keyboard only', state: await read() });
    await page.screenshot({ path: path.join(output, '03-goal.png'), fullPage: true });
    const box = await page.locator('canvas').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 - 40, { steps: 12 }); await page.mouse.up();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(output, '04-orbit.png'), fullPage: true });
    metrics.checks.push({ name: 'orbit drag', passed: true });
    await reset(); await control(['ArrowRight']); await page.waitForTimeout(400);
    await page.getByLabel('Graine du monde').focus(); await page.waitForTimeout(700);
    const released = await read(); await control([]);
    assert(released.speed < 2);
    await page.keyboard.press('ArrowUp'); assert.equal(await page.getByLabel('Graine du monde').inputValue(), '71');
    metrics.checks.push({ name: 'blur releases thrust, seed input retains arrow keys', passed: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, '05-narrow.png'), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    metrics.checks.push({ name: '390 × 844 responsive layout without horizontal overflow (not a mobile device)', passed: true });
    await page.setViewportSize({ width: 1440, height: 1100 });
    await reset();
    const start = await read();
    const fpsPromise = page.evaluate(() => new Promise((resolve) => {
      const intervals = []; const start = performance.now(); let previous = start;
      const frame = (now) => {
        intervals.push(now - previous); previous = now;
        if (now - start < 30000) return requestAnimationFrame(frame);
        intervals.sort((a, b) => a - b);
        resolve({ durationMs: now - start, frames: intervals.length, fps: intervals.length * 1000 / (now - start), p50Ms: intervals[Math.floor(intervals.length * 0.5)], p95Ms: intervals[Math.floor(intervals.length * 0.95)], p99Ms: intervals[Math.floor(intervals.length * 0.99)], maxMs: intervals.at(-1) });
      }; requestAnimationFrame(frame);
    }));
    const samples = [];
    for (let index = 0; index < 10; index++) {
      await control([['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][index % 4]]);
      await page.waitForTimeout(3000); const state = await read(); samples.push(state);
      assert(Math.abs(state.position[0]) <= 5.68 && Math.abs(state.position[2]) <= 5.68);
    }
    await control([]); metrics.performance = { ...await fpsPromise, simulatedSeconds: (await read()).elapsed - start.elapsed, samples };
    assert(metrics.performance.simulatedSeconds > 28);
    await page.screenshot({ path: path.join(output, '06-after-30s.png'), fullPage: true });
    assert.deepEqual(errors, []);

    const unsupported = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    unsupported.setDefaultTimeout(15000);
    const unsupportedErrors = [];
    unsupported.on('pageerror', (error) => unsupportedErrors.push(error.message));
    unsupported.on('console', (message) => { if (message.type() === 'error') unsupportedErrors.push(message.text()); });
    await unsupported.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (/webgl/.test(type)) return null;
        return original.call(this, type, ...args);
      };
    });
    await unsupported.goto(process.env.BALL_THRUST_URL || 'http://127.0.0.1:4170/');
    await unsupported.getByRole('alert').filter({ hasText: /WebGL/ }).waitFor();
    await unsupported.screenshot({ path: path.join(output, '07-no-webgl.png'), fullPage: true });
    assert.deepEqual(unsupportedErrors, []);
    metrics.checks.push({ name: 'text fallback with WebGL context denied', passed: true, errors: unsupportedErrors });
    await unsupported.close();
    metrics.passed = true;
  } finally {
    metrics.consoleMessages = consoleMessages; metrics.errors = errors;
    fs.writeFileSync(path.join(output, 'browser-metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
    await browser.close();
  }
  console.log(JSON.stringify({ passed: metrics.passed, performance: metrics.performance, errors }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
