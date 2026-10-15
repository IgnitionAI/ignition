import RAPIER from '@dimforge/rapier3d-compat';
import * as tf from '@tensorflow/tfjs';
import { beforeAll, expect, it, vi } from 'vitest';
import { BallThrustEnv } from '../src/ball-thrust-env';
import { TrainingSession, weightValues, MODEL_ID } from '../src/training-session';
import type { ModelInfo, ModelStorageProvider } from '@ignitionai/storage';

class MemoryStorage implements ModelStorageProvider {
  artifacts?: tf.io.ModelArtifacts;
  metadata?: Record<string, unknown>;
  async save(_id: string, model: tf.LayersModel, metadata?: Record<string, unknown>): Promise<string> {
    await model.save(tf.io.withSaveHandler(async artifacts => {
      this.artifacts = artifacts;
      return { modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts) };
    }));
    this.metadata = structuredClone(metadata);
    return 'memory://checkpoint';
  }
  async load(): Promise<tf.LayersModel> {
    if (!this.artifacts) throw new Error('Missing checkpoint.');
    return tf.loadLayersModel(tf.io.fromMemory(this.artifacts));
  }
  async list(): Promise<ModelInfo[]> { return this.metadata ? [{ modelId: MODEL_ID, uri: 'memory://checkpoint', metadata: this.metadata }] : []; }
  async delete(): Promise<void> { this.artifacts = undefined; this.metadata = undefined; }
  async exists(): Promise<boolean> { throw new Error('exists must not be used'); }
}

beforeAll(async () => { await RAPIER.init(); await tf.setBackend('cpu'); await tf.ready(); });

it('learns for 64 transitions, then freezes exact weights and updates for 32 inference transitions', async () => {
  const session = new TrainingSession(new BallThrustEnv());
  try {
    const before = weightValues(session.agent);
    await session.runSteps(64, 'training');
    const trained = weightValues(session.agent);
    expect(trained).not.toEqual(before);
    expect(session.snapshot()).toMatchObject({ trainingSteps: 64, updates: 33, parameterCount: 2057, changedWeights: true });
    await session.runSteps(32, 'inference');
    expect(weightValues(session.agent)).toEqual(trained);
    expect(session.snapshot()).toMatchObject({ trainingSteps: 64, inferenceSteps: 32, updates: 33 });
    console.info('learning-proof', { trainingSteps: 64, inferenceSteps: 32, updates: 33, parameters: trained.length,
      changedValues: trained.filter((v, i) => v !== before[i]).length,
      maxWeightDelta: Math.max(...trained.map((v, i) => Math.abs(v - before[i]))) });
  } finally { await session.dispose(); }
}, 20000);

it('awaits a real deferred fit before pause/reset/save and synchronizes after manual mode', async () => {
  const session = new TrainingSession(new BallThrustEnv());
  try {
    await session.runSteps(31, 'training');
    const model = session.agent.getModel();
    const fit = model.fit.bind(model);
    let release!: () => void;
    let entered!: () => void;
    const enteredFit = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    model.fit = async (...args) => { entered(); await gate; return fit(...args); };
    await session.start('training');
    await enteredFit;
    let paused = false;
    const pause = session.pause().then(() => { paused = true; });
    const reset = session.newEpisode(91);
    await Promise.resolve();
    expect(paused).toBe(false);
    expect(session.snapshot().busy).toBe(true);
    release();
    await Promise.all([pause, reset]);
    expect(session.snapshot()).toMatchObject({ mode: 'paused', busy: false, trainingSteps: 32, seed: 91 });
    expect(session.env.steps).toBe(0);
    model.fit = fit;
    session.manualAction = () => 3;
    await session.start('manual');
    await new Promise(resolve => setTimeout(resolve, 125));
    await session.pause();
    const observation = session.env.observe();
    let seen: number[] = [];
    const getAction = session.agent.getAction.bind(session.agent);
    session.agent.getAction = async (state, greedy) => { seen = [...state]; return getAction(state, greedy); };
    await session.runSteps(1, 'inference');
    expect(seen).toEqual(observation);
  } finally { await session.dispose(); }
}, 20000);

it('enforces the per-network cap through pause/resume/reset and clears it only with a new network', async () => {
  const session = new TrainingSession(new BallThrustEnv(), undefined, 36);
  try {
    await session.runSteps(35, 'training');
    await session.newEpisode(72);
    await session.runSteps(20, 'training');
    await session.start('training');
    expect(session.snapshot()).toMatchObject({ trainingSteps: 36, budgetReached: true, mode: 'paused' });
    const weights = weightValues(session.agent);
    await session.runSteps(20, 'training');
    expect(weightValues(session.agent)).toEqual(weights);
    await session.newNetwork();
    expect(session.snapshot()).toMatchObject({ trainingSteps: 0, inferenceSteps: 0, budgetReached: false, updates: 0, changedWeights: false });
    await session.runSteps(1, 'training');
    expect(session.snapshot().trainingSteps).toBe(1);
  } finally { await session.dispose(); }
});

it('stops training and evaluation at the common five-minute experiment deadline without changing weights', async () => {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
  const session = new TrainingSession(new BallThrustEnv());
  try {
    await session.runSteps(32, 'training');
    const weights = weightValues(session.agent);
    clock.mockReturnValue(301001);
    await session.runSteps(20, 'training');
    await session.start('training');
    expect(session.snapshot()).toMatchObject({ trainingSteps: 32, updates: 1, budgetReached: true, mode: 'paused' });
    await expect(session.evaluate()).rejects.toThrow(/wall-time/);
    expect(weightValues(session.agent)).toEqual(weights);
    await session.runSteps(2, 'inference');
    expect(session.snapshot().inferenceSteps).toBe(2);
    await session.newNetwork();
    expect(session.snapshot().budgetReached).toBe(false);
  } finally { clock.mockRestore(); await session.dispose(); }
});

it('round-trips real TF artifacts/state, rejects malformed metadata/artifacts and keeps the active network', async () => {
  const storage = new MemoryStorage();
  const session = new TrainingSession(new BallThrustEnv(), storage);
  try {
    await session.load();
    expect(session.snapshot().error).not.toBe('');
    await session.runSteps(64, 'training');
    const weights = weightValues(session.agent);
    const observation = session.env.observe();
    const action = await session.agent.getAction(observation, true);
    const snapshot = session.snapshot();
    await session.save();
    await session.runSteps(8, 'training');
    await session.load();
    expect(session.snapshot().error).toBe('');
    expect(weightValues(session.agent)).toEqual(weights);
    expect(await session.agent.getAction(observation, true)).toBe(action);
    expect(session.snapshot()).toMatchObject({ trainingSteps: snapshot.trainingSteps, updates: snapshot.updates, epsilon: snapshot.epsilon });
    expect(session.snapshot().notice).toMatch(/Replay is empty/);
    // The loaded agent must still use the original provider's prototype methods.
    await session.save();
    expect(session.snapshot().error).toBe('');
    const metadata = structuredClone(storage.metadata!);
    for (const invalid of [NaN, Infinity, -1, '64', 1.2]) {
      storage.metadata!.trainingSteps = invalid;
      await session.load();
      expect(session.snapshot().error).not.toBe('');
      expect(weightValues(session.agent)).toEqual(weights);
    }
    storage.metadata = metadata;
    const originalLoad = storage.load.bind(storage);
    storage.load = async () => tf.sequential({ layers: [tf.layers.dense({ inputShape: [2], units: 9 })] });
    await session.load();
    expect(session.snapshot().error).toMatch(/shape/);
    expect(weightValues(session.agent)).toEqual(weights);
    storage.load = originalLoad;
    storage.save = async () => { throw new Error('Quota exceeded'); };
    await session.save();
    expect(session.snapshot()).toMatchObject({ mode: 'paused', busy: false, error: 'Quota exceeded' });
    await session.runSteps(1, 'inference');
    expect(session.snapshot().inferenceSteps).toBe(1);
  } finally { await session.dispose(); }
}, 20000);

it('keeps tensor memory flat after optimizer initialization and disposes all owned tensors', async () => {
  const baseline = tf.memory().numTensors;
  const session = new TrainingSession(new BallThrustEnv(), new MemoryStorage());
  try {
    await session.runSteps(40, 'training');
    const warm = tf.memory().numTensors;
    await session.runSteps(64, 'training');
    expect(tf.memory().numTensors).toBe(warm);
    await session.save();
    await session.load();
    await session.runSteps(40, 'training');
    const loadedWarm = tf.memory().numTensors;
    await session.runSteps(40, 'training');
    expect(tf.memory().numTensors).toBe(loadedWarm);
    console.info('memory-plateau', { warm, loadedWarm, afterFurtherUpdates: tf.memory().numTensors });
    for (let i = 0; i < 3; i++) {
      await session.newNetwork();
      await session.runSteps(40, 'training');
      expect(tf.memory().numTensors).toBe(warm);
    }
  } finally { await session.dispose(); }
  expect(tf.memory().numTensors).toBe(baseline);
  console.info('memory-proof', { baseline, afterDispose: tf.memory().numTensors });
}, 20000);

it('evaluates held-out worlds without changing the visible world, weights, counters or tensor count', async () => {
  const session = new TrainingSession(new BallThrustEnv());
  try {
    const weights = weightValues(session.agent);
    const observation = session.env.observe();
    const before = session.snapshot();
    const tensors = tf.memory().numTensors;
    const report = await session.evaluate();
    expect(report.initial).toEqual(report.trained);
    for (const policy of [report.initial, report.trained, report.random]) {
      expect(policy.episodes.map(e => e.seed)).toEqual([1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007]);
      expect(policy.episodes.every(e => e.steps > 0 && e.steps <= 300 && Number.isFinite(e.return) && Number.isFinite(e.distance))).toBe(true);
    }
    expect(session.env.observe()).toEqual(observation);
    expect(weightValues(session.agent)).toEqual(weights);
    expect(session.snapshot()).toMatchObject({ trainingSteps: before.trainingSteps, inferenceSteps: before.inferenceSteps, updates: before.updates });
    expect(tf.memory().numTensors).toBe(tensors);
  } finally { await session.dispose(); }
}, 20000);

it('recompiles an artifact without trainingConfig and performs real updates after loading', async () => {
  const storage = new MemoryStorage();
  const session = new TrainingSession(new BallThrustEnv(), storage);
  try {
    await session.runSteps(40, 'training');
    await session.save();
    // Actual TF artifact, deliberately omitting only the optional compile configuration.
    delete storage.artifacts!.trainingConfig;
    await session.load();
    expect(session.snapshot().error).toBe('');
    const weights = weightValues(session.agent);
    const updates = session.snapshot().updates;
    await session.runSteps(40, 'training');
    expect(session.snapshot().error).toBe('');
    expect(session.snapshot().updates).toBe(updates + 9); // Empty replay warms up anew.
    expect(weightValues(session.agent)).not.toEqual(weights);
    expect(session.snapshot().notice).toMatch(/optimizer\/RNG state is not restored/);
  } finally { await session.dispose(); }
});
