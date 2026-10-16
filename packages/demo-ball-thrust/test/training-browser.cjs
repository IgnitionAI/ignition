// Real UI + IndexedDB evidence. Uses the existing Playwright installation.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const output = path.resolve(process.argv[2] || '.scratch/ball-thrust-training');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false, executablePath: process.env.CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(20000);
  const errors = [];
  const messages = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    messages.push({ type: message.type(), text: message.text() });
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  const metrics = { sha: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(), status: 'running', browser: await browser.version(), headless: false, checks: [] };
  const persist = () => fs.writeFileSync(path.join(output, 'training-browser.json'), JSON.stringify({ ...metrics, errors, console: messages }, null, 2) + '\n');
  const number = id => page.getByTestId(id).textContent().then(text => parseFloat(text));
  const snapshot = async () => ({ trainingSteps: await number('train-steps'), updates: await number('updates'), inferenceSteps: await number('infer-steps'), fingerprint: await page.getByTestId('weight-fingerprint').textContent(), tensors: await number('tensors'), epsilon: await number('epsilon') });
  const paused = () => page.waitForFunction(() => document.querySelector('[data-testid="mode"]')?.textContent === 'En pause');
  const click = async id => { await page.getByTestId(id).click(); };
  const checkpoint = () => page.evaluate(async () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('ignition:meta:ball-thrust'));
    if (keys.length !== 1) throw new Error(`Expected one Ball Thrust checkpoint, got ${keys}`);
    const modelId = keys[0].slice('ignition:meta:'.length);
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('tensorflowjs');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const model = await new Promise((resolve, reject) => {
        const request = db.transaction('models_store').objectStore('models_store').get(modelId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const artifacts = model?.modelArtifacts;
      if (!artifacts?.weightData) throw new Error('Checkpoint has no real TensorFlow weights');
      return { modelId, metadata: JSON.parse(localStorage.getItem(keys[0])), weightSpecs: artifacts.weightSpecs, bytes: Array.from(new Uint8Array(artifacts.weightData)) };
    } finally { db.close(); }
  });
  const save = async name => {
    await click('save'); await paused();
    const result = await checkpoint();
    fs.writeFileSync(path.join(output, `${name}.json`), JSON.stringify(result) + '\n');
    return result;
  };
  try {
    await page.goto(process.env.BALL_THRUST_URL || 'http://localhost:4170/');
    await page.waitForFunction(() => document.querySelector('[data-testid="mode"]')?.textContent === 'Manuel');
    await page.getByTestId('train').scrollIntoViewIfNeeded();
    assert.equal(await page.getByTestId('backend').textContent(), 'cpu');
    metrics.renderer = await page.locator('canvas').evaluate(canvas => {
      const gl = canvas.getContext('webgl2');
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    });
    await click('load');
    await page.getByRole('alert').first().waitFor();
    metrics.checks.push({ name: 'missing checkpoint is visible and recoverable', error: await page.getByRole('alert').first().textContent() });
    await page.screenshot({ path: path.join(output, '01-missing-checkpoint.png'), fullPage: true });
    await click('new-network'); await paused();
    await page.getByTestId('new-episode').click(); await paused();
    const initial = await snapshot();
    const before = await save('weights-initial');
    assert.equal(initial.trainingSteps, 0);
    assert.equal(await page.getByTestId('weights-changed').textContent(), 'Non');
    await page.screenshot({ path: path.join(output, '02-initial-network.png'), fullPage: true });

    // One measured run, no tuning/retry: only pause/resume on the same trajectory.
    const startedAt = Date.now();
    const experimentDeadline = startedAt + 300000;
    await click('train');
    await page.waitForFunction(() => parseFloat(document.querySelector('[data-testid="train-steps"]').textContent) >= 64);
    await click('pause'); await paused();
    const warm = await snapshot();
    await page.waitForTimeout(250);
    assert.deepEqual(await snapshot(), warm, 'pause must wait for the in-flight fit and then remain stable');
    assert(warm.updates > 0 && warm.fingerprint !== initial.fingerprint);
    metrics.checks.push({ name: 'real updates and awaited pause', initial, warm });
    await page.screenshot({ path: path.join(output, '03-real-training.png'), fullPage: true });
    await click('train');
    await page.waitForFunction(() => parseFloat(document.querySelector('[data-testid="train-steps"]').textContent) >= 4096, undefined, { timeout: Math.max(1, experimentDeadline - Date.now()) });
    await paused();
    const trained = await snapshot();
    metrics.training = { ...trained, wallMs: Date.now() - startedAt, seed: 70, agentSeed: 68, maximumTransitions: 4096 };
    assert(metrics.training.wallMs <= 300000, 'frozen wall budget exceeded');
    assert.equal(trained.trainingSteps, 4096);
    assert.equal(trained.updates, 4065);
    assert(await page.getByTestId('train').isDisabled());
    const after = await save('weights-trained');
    assert.notDeepEqual(after.bytes, before.bytes);
    assert.deepEqual(after.weightSpecs.map(weight => weight.shape), before.weightSpecs.map(weight => weight.shape));
    const floatValues = bytes => new Float32Array(Uint8Array.from(bytes).buffer);
    const initialValues = floatValues(before.bytes), trainedValues = floatValues(after.bytes);
    let changed = 0, l1 = 0;
    for (let index = 0; index < initialValues.length; index++) {
      assert(Number.isFinite(trainedValues[index]));
      const difference = Math.abs(trainedValues[index] - initialValues[index]);
      changed += difference !== 0; l1 += difference;
    }
    metrics.weightProof = { parameterCount: trainedValues.length, changedParameters: changed, l1Difference: l1 };
    assert(changed > 0 && l1 > 0);
    await page.screenshot({ path: path.join(output, '04-trained-network.png'), fullPage: true });
    persist();

    await click('evaluate');
    await page.getByTestId('evaluation-table').waitFor({ timeout: Math.max(1, experimentDeadline - Date.now()) });
    await paused();
    metrics.evaluation = JSON.parse(await page.getByTestId('evaluation-json').textContent());
    metrics.experimentWallMs = Date.now() - startedAt;
    assert(metrics.experimentWallMs <= 300000, 'common training/evaluation wall budget exceeded');
    for (const policy of ['initial', 'trained', 'random']) {
      assert.deepEqual(metrics.evaluation[policy].episodes.map(episode => episode.seed), [1000,1001,1002,1003,1004,1005,1006,1007]);
      assert(metrics.evaluation[policy].episodes.every(episode => episode.steps <= 300 && Number.isFinite(episode.return)));
    }
    const evaluated = await snapshot();
    assert.equal(evaluated.updates, trained.updates);
    assert.equal(evaluated.fingerprint, trained.fingerprint);
    assert.deepEqual((await save('weights-after-evaluation')).bytes, after.bytes);
    await page.screenshot({ path: path.join(output, '05-evaluation.png'), fullPage: true });
    persist();

    await page.reload();
    await page.waitForFunction(() => document.querySelector('[data-testid="mode"]')?.textContent === 'Manuel');
    assert.equal((await snapshot()).trainingSteps, 0);
    await click('load'); await paused();
    const loaded = await snapshot();
    assert.equal(loaded.fingerprint, trained.fingerprint);
    assert.equal(loaded.trainingSteps, trained.trainingSteps);
    assert.equal(loaded.updates, trained.updates);
    assert.deepEqual((await save('weights-reloaded')).bytes, after.bytes);
    await click('inference');
    await page.waitForFunction(() => parseFloat(document.querySelector('[data-testid="infer-steps"]').textContent) >= 32);
    await click('pause'); await paused();
    const inferred = await snapshot();
    assert.equal(inferred.updates, loaded.updates);
    assert.equal(inferred.trainingSteps, loaded.trainingSteps);
    assert.equal(inferred.fingerprint, loaded.fingerprint);
    assert.deepEqual((await save('weights-after-inference')).bytes, after.bytes);
    metrics.checks.push({ name: 'reload checkpoint and 32+ inference transitions preserve all weight bytes and update counters', loaded, inferred });

    await click('inference');
    const performanceStart = await snapshot();
    metrics.performance = await page.evaluate(() => new Promise(resolve => {
      const intervals = []; const start = performance.now(); let previous = start;
      function frame(now) {
        intervals.push(now - previous); previous = now;
        if (now - start < 30000) return requestAnimationFrame(frame);
        intervals.sort((a, b) => a - b);
        resolve({ durationMs: now - start, frames: intervals.length, fps: intervals.length * 1000 / (now - start), p95Ms: intervals[Math.floor(intervals.length * .95)], maxMs: intervals.at(-1), metric: 'headed desktop RAF cadence, not GPU timing' });
      }
      requestAnimationFrame(frame);
    }));
    await page.screenshot({ path: path.join(output, '06-inference.png'), fullPage: true });
    await click('pause'); await paused();
    const performanceEnd = await snapshot();
    metrics.performance.inferenceTransitions = performanceEnd.inferenceSteps - performanceStart.inferenceSteps;
    metrics.performance.simulatedSeconds = metrics.performance.inferenceTransitions / 10;
    assert(metrics.performance.inferenceTransitions >= 200);
    assert.equal(performanceEnd.updates, trained.updates);
    assert.deepEqual((await save('weights-after-30s-inference')).bytes, after.bytes);
    await page.getByTestId('new-episode').click(); await paused();
    assert.equal(await number('time'), 0);
    assert.equal((await snapshot()).fingerprint, trained.fingerprint);
    metrics.checks.push({ name: 'new episode preserves learned network', passed: true });
    const tensorCounts = [];
    for (let index = 0; index < 3; index++) {
      await click('new-network'); await paused();
      await click('load'); await paused();
      await click('inference');
      const count = await number('infer-steps');
      await page.waitForFunction(value => parseFloat(document.querySelector('[data-testid="infer-steps"]').textContent) > value + 2, count);
      await click('pause'); await paused();
      tensorCounts.push(await number('tensors'));
    }
    assert(tensorCounts.every(count => count === tensorCounts[0]));
    metrics.checks.push({ name: 'three fresh-network/load/infer cycles keep tensor count flat', tensorCounts });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, '07-training-narrow.png'), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    metrics.status = 'passed';
  } catch (error) {
    metrics.status = 'failed'; metrics.failure = error.stack;
    await click('pause').catch(() => {});
    await paused().catch(() => {});
    metrics.finalSnapshot = await snapshot().catch(() => null);
    await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    persist();
    await browser.close();
  }
  console.log(JSON.stringify({ status: metrics.status, training: metrics.training, evaluation: metrics.evaluation, performance: metrics.performance, weightProof: metrics.weightProof, errors }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
