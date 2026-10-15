import { snapshotWeights, weightsDelta, type RobotArmController } from './controller';

interface E2EStatus {
  phase: string;
  ok: boolean;
  transitions: number;
  updates: number;
  epsilon: number | null;
  errors: string[];
  fpsTrain?: { avgFps: number; p95FrameMs: number; frames: number };
  fpsInfer?: { avgFps: number; p95FrameMs: number; frames: number };
  weightCheck?: { trained: boolean; inferenceInvariant: boolean };
  note?: string;
}

/**
 * Real-browser evidence driver, activated only with ?e2e=1 (used by the
 * headless-Chromium verification of issue #64). It drives the exact same
 * controller as the buttons: train, wait for real weight updates, switch to
 * greedy inference, exercise an episode reset, and report console errors + FPS.
 */
export function maybeRunE2E(controller: RobotArmController): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get('e2e') !== '1') return;
  // evidence captures: freeze the page after a given phase for screenshots
  const stopAfter = params.get('stopafter'); // 'train' | 'inference' | null

  const errors: string[] = [];
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    errors.push(args.map(String).join(' ').slice(0, 500));
    originalError(...args);
  };
  window.addEventListener('error', (event) => errors.push(`window: ${String(event.message).slice(0, 500)}`));
  window.addEventListener('unhandledrejection', (event) =>
    errors.push(`rejection: ${String(event.reason).slice(0, 500)}`),
  );

  const node = document.createElement('pre');
  node.id = 'e2e-status';
  node.style.display = 'none';
  document.body.appendChild(node);

  const status: E2EStatus = {
    phase: 'boot',
    ok: false,
    transitions: 0,
    updates: 0,
    epsilon: null,
    errors,
  };
  const publish = () => {
    const snap = controller.snapshot();
    status.transitions = snap.transitions;
    status.updates = snap.updates;
    status.epsilon = snap.epsilon;
    node.textContent = JSON.stringify(status, null, 2);
    document.title = `e2e:${status.phase}:${status.ok ? 'ok' : 'run'}`;
  };
  publish();
  const timer = window.setInterval(publish, 250);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const measureFps = async (ms: number) => {
    const deltas: number[] = [];
    let last = performance.now();
    let stop = false;
    const tick = (now: number) => {
      if (stop) return;
      deltas.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await sleep(ms);
    stop = true;
    const sorted = [...deltas].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    const avgFps = deltas.length > 0 ? 1000 / (deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0;
    return { avgFps: Math.round(avgFps * 10) / 10, p95FrameMs: Math.round(p95 * 100) / 100, frames: deltas.length };
  };

  const waitFor = async (predicate: () => boolean, timeoutMs: number, label: string) => {
    const start = performance.now();
    while (!predicate()) {
      if (performance.now() - start > timeoutMs) throw new Error(`timeout waiting for ${label}`);
      await sleep(100);
    }
  };

  void (async () => {
    try {
      status.phase = 'train';
      publish();
      await controller.train();
      await waitFor(() => controller.updateCount >= 3, 120_000, '3 weight updates');
      const model = controller.getModel();
      const before = model ? snapshotWeights(model) : null;
      await sleep(2000); // keep training for the FPS sample
      const trainedDelta = model && before ? weightsDelta(before, snapshotWeights(model)) : 0;

      status.fpsTrain = await measureFps(4000);
      if (stopAfter === 'train') {
        controller.pause();
        status.phase = 'frozen-train';
        status.ok = errors.length === 0 && trainedDelta > 0;
        publish();
        window.clearInterval(timer);
        return;
      }

      status.phase = 'inference';
      publish();
      controller.infer();
      const inferStart = controller.snapshot().transitions;
      await waitFor(() => controller.snapshot().transitions >= inferStart + 30, 60_000, '30 inference steps');
      const inferA = model ? snapshotWeights(model) : null;
      await sleep(1500);
      const inferDrift =
        model && inferA ? weightsDelta(inferA, snapshotWeights(model)) : Number.POSITIVE_INFINITY;
      status.fpsInfer = await measureFps(4000);
      status.weightCheck = { trained: trainedDelta > 0, inferenceInvariant: inferDrift === 0 };
      if (stopAfter === 'inference') {
        controller.pause();
        status.phase = 'frozen-inference';
        status.ok = errors.length === 0 && trainedDelta > 0 && inferDrift === 0;
        publish();
        window.clearInterval(timer);
        return;
      }

      status.phase = 'episode';
      publish();
      await controller.newEpisode();
      await sleep(300);

      status.phase = 'done';
      status.ok =
        errors.length === 0 && trainedDelta > 0 && inferDrift === 0 && status.updates > 0;
      if (errors.length > 0) status.note = 'console errors present';
      publish();
    } catch (error) {
      status.phase = 'failed';
      status.note = error instanceof Error ? error.message : String(error);
      publish();
    } finally {
      window.clearInterval(timer);
      publish();
    }
  })();
}
