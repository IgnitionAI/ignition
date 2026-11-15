import { readFileSync } from 'node:fs';
import RAPIER from '@dimforge/rapier3d-compat';
import * as tf from '@tensorflow/tfjs';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { SpaceDockEnv } from '../src/space-dock-env';
import { DockTrainingEnv, TRAINING_CURRICULUM } from '../src/dock-training-env';
import { DQN_CONFIG, TrainingSession, weightValues } from '../src/training-session';
import { DockRuntime } from '../src/runtime';

beforeAll(async () => { await RAPIER.init(); await tf.setBackend('cpu'); await tf.ready(); });
const open: TrainingSession[] = [];
afterEach(async () => {
  for (const session of open.splice(0)) { await session.dispose(); session.env.dock.dispose(); }
});
async function session(options: ConstructorParameters<typeof TrainingSession>[1] = {}) {
  const created = new TrainingSession(new DockTrainingEnv(await SpaceDockEnv.create(42)), options);
  open.push(created);
  return created;
}
const until = async (condition: () => boolean, ms = 10000) => {
  const end = Date.now() + ms;
  while (!condition()) { if (Date.now() > end) throw new Error('timeout'); await new Promise(r => setTimeout(r, 5)); }
};

describe('DQN training session on the real dock', () => {
  it('trains a few hundred seeded steps with finite losses and changing weights', async () => {
    const ownership: boolean[] = [];
    const s = await session({ onOwnership: owned => ownership.push(owned) });
    const before = weightValues(s.agent);
    await s.runSteps(400, 'training');
    const state = s.snapshot(), after = weightValues(s.agent);
    expect(ownership).toEqual([true]);
    expect(state.trainingSteps).toBe(400);
    expect(state.updates).toBe(400 - DQN_CONFIG.batchSize! + 1);
    expect(state.lossUpdates).toBe(state.updates);
    expect(state.nonFiniteLosses).toBe(0);
    expect(Number.isFinite(state.lastLoss)).toBe(true);
    expect(state.epsilon).toBeLessThan(1);
    expect(after.every(Number.isFinite)).toBe(true);
    expect(after).not.toEqual(before);
    expect(state.parameterCount).toBe(26 * 64 + 64 + 64 * 64 + 64 + 64 * 8 + 8);
    expect(state.episodes).toBeGreaterThan(0); // short episodes end on collisions/bounds while exploring
    expect(state.curve).toHaveLength(Math.min(state.episodes, 300));
    expect(state.curve.every(Number.isFinite)).toBe(true);
    expect(state.recentSuccessRate).not.toBeNull();
    console.info('short-training', JSON.stringify({ steps: state.trainingSteps, updates: state.updates, lastLoss: state.lastLoss,
      epsilon: state.epsilon, episodes: state.episodes, successes: state.successes,
      outcomes: state.recentEpisodes.map(e => e.outcome) }));
  }, 60000);

  it('is reproducible with the same seeds', async () => {
    const a = await session(), b = await session();
    await a.runSteps(120, 'training'); await b.runSteps(120, 'training');
    expect(weightValues(a.agent)).toEqual(weightValues(b.agent));
    expect(a.snapshot().lastLoss).toBe(b.snapshot().lastLoss);
  }, 60000);

  it('runs the chunked loop, pauses after the in-flight fit, and resumes', async () => {
    const s = await session({ chunkMs: 4 });
    await s.runSteps(40, 'training'); // fill past the batch size so each step fits
    const model = s.agent.getModel(), fit = model.fit.bind(model);
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const inFit = new Promise<void>(resolve => { entered = resolve; });
    model.fit = (async (...args: Parameters<typeof fit>) => { entered(); await gate; return fit(...args); }) as typeof model.fit;
    await s.train();
    expect(s.snapshot().mode).toBe('training');
    await inFit;
    let paused = false;
    const pause = s.pause().then(() => { paused = true; });
    await new Promise(r => setTimeout(r, 20));
    expect(paused).toBe(false); expect(s.snapshot().busy).toBe(true);
    model.fit = fit; release(); await pause;
    const frozen = s.snapshot();
    expect(frozen).toMatchObject({ mode: 'paused', resumeMode: 'training', busy: false });
    await new Promise(r => setTimeout(r, 60));
    expect(s.snapshot().trainingSteps).toBe(frozen.trainingSteps);
    await s.resume();
    await until(() => s.snapshot().trainingSteps > frozen.trainingSteps + 20);
    await s.pause();
    const state = s.snapshot();
    expect(state.mode).toBe('paused'); expect(state.nonFiniteLosses).toBe(0); expect(state.error).toBe('');
    s.setChunkBudget(48); expect(s.snapshot().chunkMs).toBe(48);
    expect(() => s.setChunkBudget(0)).toThrow(RangeError); expect(() => s.setChunkBudget(Number.NaN)).toThrow(RangeError);
  }, 60000);

  it('exports tfjs JSON, imports it into a fresh network, and pilots greedily without updates', async () => {
    const trained = await session();
    await trained.runSteps(200, 'training');
    const json = await trained.exportModel();
    const file = JSON.parse(json);
    expect(file).toMatchObject({ format: 'ignitionai-space-dock-dqn', version: 1, config: { inputSize: 26, actionSize: 8, hiddenLayers: [64, 64] } });
    expect(typeof file.weightData).toBe('string');

    const viewer = await session();
    expect(weightValues(viewer.agent)).not.toEqual(weightValues(trained.agent));
    await viewer.importModel(json);
    const imported = weightValues(viewer.agent);
    expect(imported).toEqual(weightValues(trained.agent));

    const greedy: (boolean | undefined)[] = [], actions: number[] = [];
    const getAction = viewer.agent.getAction.bind(viewer.agent);
    viewer.agent.getAction = async (state: number[], flag?: boolean) => {
      greedy.push(flag); const action = await getAction(state, flag); actions.push(action); return action;
    };
    const updates = viewer.snapshot().updates;
    await viewer.runSteps(60, 'inference');
    expect(greedy).toHaveLength(60);
    expect(greedy.every(flag => flag === true)).toBe(true);
    expect(weightValues(viewer.agent)).toEqual(imported);
    expect(viewer.snapshot()).toMatchObject({ inferenceSteps: 60, updates, lossUpdates: 0, trainingSteps: 0 });

    // Same weights + same seed => same greedy trajectory (no exploration noise).
    const twin = await session();
    await twin.importModel(json);
    const twinActions: number[] = [];
    const twinGet = twin.agent.getAction.bind(twin.agent);
    twin.agent.getAction = async (state: number[], flag?: boolean) => { const a = await twinGet(state, flag); twinActions.push(a); return a; };
    await twin.runSteps(60, 'inference');
    expect(twinActions).toEqual(actions);
  }, 60000);

  it('watch() drives the dock at the decision rate and can be paused', async () => {
    const s = await session({ inferenceIntervalMs: 5 });
    await s.watch();
    await until(() => s.snapshot().inferenceSteps >= 5);
    await s.pause();
    expect(s.snapshot()).toMatchObject({ mode: 'paused', resumeMode: 'inference', updates: 0 });
  }, 30000);

  it('rejects incompatible or corrupted model files without touching the weights', async () => {
    const s = await session();
    const before = weightValues(s.agent);
    const json = JSON.parse(await s.exportModel());
    await expect(s.importModel('{')).rejects.toThrow(/JSON/);
    await expect(s.importModel(JSON.stringify({ ...json, format: 'other' }))).rejects.toThrow(/format/);
    await expect(s.importModel(JSON.stringify({ ...json, config: { ...json.config, hiddenLayers: [32] } }))).rejects.toThrow(/architecture/);
    const nan = new Float32Array(before.length).fill(Number.NaN);
    const bytes = new Uint8Array(nan.buffer); let text = '';
    for (const byte of bytes) text += String.fromCharCode(byte);
    await expect(s.importModel(JSON.stringify({ ...json, weightData: btoa(text) }))).rejects.toThrow(/finite/);
    expect(weightValues(s.agent)).toEqual(before);
  }, 30000);

  it('reset() restores the seeded initial network; stop() hands the dock back to the runtime', async () => {
    const dock = await SpaceDockEnv.create(42), runtime = new DockRuntime(dock);
    const s = new TrainingSession(new DockTrainingEnv(dock), { onOwnership: owned => runtime.setExternal(owned) });
    open.push(s);
    const initial = weightValues(s.agent);
    await s.runSteps(80, 'training');
    expect(runtime.isExternal).toBe(true);
    const ticks = dock.telemetry.ticks;
    runtime.press('keyboard', 1); runtime.advance(1); runtime.reset(5);
    expect(dock.telemetry.ticks).toBe(ticks); // manual input, runtime stepping and reset are locked out
    await s.stop();
    expect(runtime.isExternal).toBe(false); expect(s.snapshot().mode).toBe('idle');
    expect(s.snapshot().trainingSteps).toBe(80);
    runtime.advance(0.1); expect(dock.telemetry.ticks).toBeGreaterThan(ticks);
    await s.runSteps(10, 'training');
    expect(s.env.steps).toBe(10); // re-acquired with a fresh seeded episode after manual driving
    await s.reset();
    expect(weightValues(s.agent)).toEqual(initial);
    expect(s.snapshot()).toMatchObject({ mode: 'idle', trainingSteps: 0, episodes: 0, updates: 0, curve: [], lastLoss: null });
    expect(runtime.isExternal).toBe(false);
  }, 60000);
  it('trains on curriculum starts but watches from the standard start', async () => {
    const s = await session();
    await s.runSteps(3, 'training');
    expect(s.env.startDistance).toEqual(TRAINING_CURRICULUM);
    expect(s.snapshot().curriculum).toEqual(TRAINING_CURRICULUM);
    await s.runSteps(2, 'inference');
    expect(s.env.startDistance).toBeUndefined();
    expect(s.env.steps).toBe(2); // switching mode starts a fresh standard episode
    const off = await session({ curriculum: null });
    await off.runSteps(1, 'training'); expect(off.env.startDistance).toBeUndefined();
  }, 30000);

  it('ships a pre-trained agent with provenance that docks greedily from the standard start', async () => {
    const text = readFileSync(new URL('../src/pretrained/space-dock-dqn.json', import.meta.url), 'utf8');
    const file = JSON.parse(text);
    const s = await session();
    await s.importModel(text, { pretrained: true });
    const state = s.snapshot();
    expect(state.provenance).toEqual(file.provenance);
    expect(state.provenance!.evaluation.start).toBe('standard');
    expect(state.epsilon).toBeLessThanOrEqual(DQN_CONFIG.minEpsilon!);
    const before = weightValues(s.agent);
    for (let i = 0; i < 300 && s.snapshot().inferenceEpisodes === 0; i++) await s.runSteps(1, 'inference');
    const watched = s.snapshot();
    expect(watched.lastInferenceEpisode?.outcome).toBe('success');
    expect(weightValues(s.agent)).toEqual(before);
    console.info('pretrained-standard-start', JSON.stringify(watched.lastInferenceEpisode));
    // A visitor's own file never displays a provenance, even if it carries one.
    const other = await session();
    await other.importModel(text);
    expect(other.snapshot().provenance).toBeNull();
    await expect(other.importModel(JSON.stringify({ ...file, provenance: { source: 'offline' } }), { pretrained: true })).rejects.toThrow(/provenance/);
  }, 60000);
});
