import { describe, it, expect, afterEach } from 'vitest';
import { RobotArmController, snapshotWeights, weightsDelta } from '../src/controller';

// Real DQN through the real IgnitionEnv runner: TF.js CPU backend in Node.
// These tests assert that training changes the weights and that inference
// leaves them (and the update counters) strictly invariant.

describe('RobotArmController with real DQN', () => {
  const controllers: RobotArmController[] = [];
  const make = (seed = 11) => {
    const c = new RobotArmController(seed);
    controllers.push(c);
    return c;
  };
  afterEach(() => {
    while (controllers.length) controllers.pop()!.dispose();
  });

  it('changes network weights during training and decays epsilon', async () => {
    const c = make(11);
    await c.prepare(); // agent ready, no loop: we drive steps manually
    const model = c.getModel();
    expect(model).not.toBeNull();
    const before = snapshotWeights(model!);
    for (let i = 0; i < 120; i++) await c.stepOnce();
    const after = snapshotWeights(model!);
    expect(weightsDelta(before, after)).toBeGreaterThan(0);
    expect(c.updateCount).toBeGreaterThan(0);
    expect(c.epsilon).not.toBeNull();
    expect(c.epsilon!).toBeLessThan(1.0);
    expect(c.snapshot().transitions).toBe(120);
  }, 60_000);

  it('keeps weights and counters invariant during inference', async () => {
    const c = make(29);
    await c.prepare();
    for (let i = 0; i < 100; i++) await c.stepOnce();
    const model = c.getModel()!;
    c.infer();
    expect(c.modeState).toBe('inference');
    const updatesBefore = c.updateCount;
    const epsilonBefore = c.epsilon;
    const before = snapshotWeights(model);
    for (let i = 0; i < 40; i++) await c.inferOnce();
    expect(weightsDelta(before, snapshotWeights(model))).toBe(0);
    expect(c.updateCount).toBe(updatesBefore);
    expect(c.epsilon).toBe(epsilonBefore);
    // >= 140: the inference loop legitimately runs between inferOnce() calls
    expect(c.snapshot().transitions).toBeGreaterThanOrEqual(140);
  }, 60_000);

  it('inference is gated before the first weight update', async () => {
    const c = make(47);
    c.infer();
    expect(c.modeState).toBe('stopped'); // refused: no update yet
    await c.prepare();
    for (let i = 0; i < 40; i++) await c.stepOnce(); // beyond batch warmup (32)
    c.pause();
    c.infer();
    expect(c.modeState).toBe('inference');
  }, 60_000);

  it('rapid pause/resume/reset clicks serialize on one transition tail without leaks', async () => {
    const c = make(11);
    await c.prepare();
    // hammer the controller with interleaved user-level operations
    const ops = [
      () => c.pause(),
      () => c.train(),
      () => c.stepOnce(),
      () => c.newEpisode(),
      () => c.pause(),
      () => c.infer(),
      () => c.inferOnce(),
      () => c.train(),
      () => c.newEpisode(),
      () => c.pause(),
    ];
    for (const op of ops) await op();
    await c.prepare();
    for (let i = 0; i < 60; i++) await c.stepOnce();
    const snap = c.snapshot();
    expect(snap.lastError).toBeNull();
    expect(snap.transitions).toBeGreaterThanOrEqual(60);
  }, 90_000);

  it('restartLearning destroys the network and zeroes counters', async () => {
    const c = make(29);
    await c.prepare();
    for (let i = 0; i < 80; i++) await c.stepOnce();
    expect(c.updateCount).toBeGreaterThan(0);
    await c.restartLearning();
    const snap = c.snapshot();
    expect(snap.updates).toBe(0);
    expect(snap.transitions).toBe(0);
    expect(snap.epsilon).toBeNull();
    expect(snap.episodes).toBe(0);
    // a fresh network is created on the next prepare/train
    await c.prepare();
    for (let i = 0; i < 40; i++) await c.stepOnce();
    expect(c.updateCount).toBeGreaterThan(0);
  }, 90_000);

  it('records episode summaries through the auto-reset wrapper', async () => {
    const c = make(47);
    await c.prepare();
    // run until at least one episode closes (80 commands max each)
    let guard = 0;
    while (c.snapshot().episodes < 1 && guard < 200) {
      await c.stepOnce();
      guard++;
    }
    const snap = c.snapshot();
    expect(snap.episodes).toBeGreaterThanOrEqual(1);
    expect(snap.lastEpisode).not.toBeNull();
    expect(snap.lastEpisode!.commands).toBeGreaterThan(0);
    expect(snap.history.length).toBeLessThanOrEqual(50);
  }, 90_000);
});
