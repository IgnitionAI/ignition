import * as tf from '@tensorflow/tfjs';
import { DQNAgent, IgnitionEnvTFJS, type DQNConfig } from '@ignitionai/backend-tfjs';
import { DockTrainingEnv, TRAINING_CURRICULUM, TRAINING_ENV, type DockEpisode } from './dock-training-env';

/**
 * In-browser DQN training for the dock, following demo-ball-thrust/src/training-session.ts:
 * one serialized command queue, real IgnitionEnvTFJS transitions, no invented metrics.
 * The loop runs in time-boxed chunks (setTimeout) so the R3F frame loop keeps rendering.
 */
export const DQN_CONFIG: Readonly<DQNConfig> = Object.freeze({
  inputSize: TRAINING_ENV.observationSize, actionSize: TRAINING_ENV.actionCount, hiddenLayers: [64, 64],
  batchSize: 32, memorySize: 20000, gamma: 0.99, lr: 0.0005,
  epsilon: 1, minEpsilon: 0.05, epsilonDecay: 0.9999, targetUpdateFrequency: 1000,
  seed: 118, backend: 'cpu',
});
export const SESSION_DEFAULTS = Object.freeze({
  /** Wall-clock budget of one training chunk before yielding to the browser. */
  chunkMs: 12,
  /** Optional faster cadence: more training per frame, at the cost of rendering smoothness. */
  fastChunkMs: 48,
  /** Hard cap of transitions per chunk (slow devices still yield on chunkMs). */
  maxStepsPerChunk: 48,
  /** Watching the agent: one decision per 100 ms, the simulated decision period. */
  inferenceIntervalMs: 100,
  curveWindow: 10, curvePoints: 300, recentEpisodes: 50, successWindow: 20,
});
export const MODEL_FORMAT = 'ignitionai-space-dock-dqn';
export const MODEL_VERSION = 1;

export type SessionMode = 'idle' | 'training' | 'inference' | 'paused';
type Running = 'training' | 'inference';
export interface SessionSnapshot {
  mode: SessionMode; resumeMode: Running | null; chunkMs: number; busy: boolean; error: string; notice: string;
  trainingSteps: number; inferenceSteps: number; updates: number; epsilon: number;
  episodes: number; successes: number; successRate: number | null; recentSuccessRate: number | null;
  inferenceEpisodes: number; inferenceSuccesses: number;
  lastLoss: number | null; lossUpdates: number; nonFiniteLosses: number;
  curve: number[]; recentEpisodes: DockEpisode[]; lastInferenceEpisode: DockEpisode | null;
  episodeSteps: number; episodeReturn: number; parameterCount: number;
  provenance: ModelProvenance | null; curriculum: readonly [number, number] | null;
}
export interface SessionOptions {
  /** Called synchronously when the session takes (true) or returns (false) the shared dock. */
  onOwnership?: (owned: boolean) => void;
  /** Start distances used while training (null = standard start); watching always uses the standard start. */
  curriculum?: readonly [number, number] | null;
  config?: Partial<DQNConfig>;
  chunkMs?: number;
  maxStepsPerChunk?: number;
  inferenceIntervalMs?: number;
}
/** Written by the offline training script into a shipped model; shown verbatim to the visitor. */
export interface ModelProvenance {
  source: 'offline'; trainingSteps: number; seed: number; curriculum: readonly [number, number] | null;
  evaluation: { episodes: number; firstSeed: number; start: 'standard'; successRate: number; meanFinalDistance: number };
  commit: string; date: string;
}
interface ModelFile {
  format: string; version: number; config: { inputSize: number; actionSize: number; hiddenLayers: number[] };
  modelTopology: unknown; weightSpecs: tf.io.WeightsManifestEntry[]; weightData: string;
  trainingSteps?: number; episodes?: number; provenance?: ModelProvenance;
}

function checkProvenance(value: unknown): ModelProvenance {
  const p = value as ModelProvenance | undefined;
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  if (!p || p.source !== 'offline' || !finite(p.trainingSteps) || !finite(p.seed) || !p.evaluation
    || !finite(p.evaluation.episodes) || !finite(p.evaluation.successRate) || !finite(p.evaluation.meanFinalDistance)
    || !finite(p.evaluation.firstSeed) || typeof p.commit !== 'string' || typeof p.date !== 'string'
    || !(p.curriculum === null || (Array.isArray(p.curriculum) && p.curriculum.length === 2 && p.curriculum.every(finite)))) {
    throw new Error('Pre-trained model provenance is missing or invalid.');
  }
  return p;
}
export function weightValues(agent: DQNAgent): number[] {
  return agent.getModel().getWeights().flatMap(weight => Array.from(weight.dataSync()));
}
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer); let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}
function fromBase64(text: string): ArrayBuffer {
  const binary = atob(text), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
const message = (error: unknown) => error instanceof Error ? error.message : String(error);
const architecture = (config: DQNConfig) => ({ inputSize: config.inputSize, actionSize: config.actionSize,
  hiddenLayers: [...(config.hiddenLayers ?? [])] });

/** Rapier must be initialized and the TF.js backend selected before construction. */
export class TrainingSession {
  agent: DQNAgent;
  onChange?: () => void;
  readonly config: DQNConfig;
  private runner: IgnitionEnvTFJS;
  private mode: SessionMode = 'idle';
  private resumeMode: Running | null = null;
  private owned = false;
  private error = '';
  private notice = '';
  private trainingSteps = 0;
  private inferenceSteps = 0;
  private episodes = 0;
  private successes = 0;
  private inferenceEpisodes = 0;
  private inferenceSuccesses = 0;
  private recent: DockEpisode[] = [];
  private returns: number[] = [];
  private curve: number[] = [];
  private lastInference: DockEpisode | null = null;
  private provenance: ModelProvenance | null = null;
  private readonly curriculum: readonly [number, number] | null;
  private lastLoss: number | null = null;
  private lossUpdates = 0;
  private nonFiniteLosses = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private tail: Promise<void> = Promise.resolve();
  private generation = 0;
  private pending = 0;
  private disposed = false;
  private lastEmission = 0;
  private chunkMs: number;
  private maxStepsPerChunk: number;
  private readonly inferenceIntervalMs: number;

  constructor(readonly env: DockTrainingEnv, private readonly options: SessionOptions = {}) {
    this.config = { ...DQN_CONFIG, ...options.config };
    if (this.config.inputSize !== TRAINING_ENV.observationSize || this.config.actionSize !== env.actions) {
      throw new Error('DQN input/output sizes must match the dock observations and actions.');
    }
    this.chunkMs = options.chunkMs ?? SESSION_DEFAULTS.chunkMs;
    this.maxStepsPerChunk = options.maxStepsPerChunk ?? SESSION_DEFAULTS.maxStepsPerChunk;
    this.inferenceIntervalMs = options.inferenceIntervalMs ?? SESSION_DEFAULTS.inferenceIntervalMs;
    this.curriculum = options.curriculum === undefined ? TRAINING_CURRICULUM : options.curriculum;
    this.agent = this.createAgent();
    this.runner = this.createRunner();
  }

  snapshot(): SessionSnapshot {
    const state = this.agent.getState();
    const window = this.recent.slice(-SESSION_DEFAULTS.successWindow);
    return { mode: this.mode, resumeMode: this.resumeMode, chunkMs: this.chunkMs, busy: this.pending > 0, error: this.error, notice: this.notice,
      trainingSteps: this.trainingSteps, inferenceSteps: this.inferenceSteps,
      updates: state.trainStepCounter as number, epsilon: state.epsilon as number,
      episodes: this.episodes, successes: this.successes,
      successRate: this.episodes ? this.successes / this.episodes : null,
      recentSuccessRate: window.length ? window.filter(e => e.outcome === 'success').length / window.length : null,
      inferenceEpisodes: this.inferenceEpisodes, inferenceSuccesses: this.inferenceSuccesses,
      lastLoss: this.lastLoss, lossUpdates: this.lossUpdates, nonFiniteLosses: this.nonFiniteLosses,
      curve: [...this.curve], recentEpisodes: this.recent.map(e => ({ ...e })),
      lastInferenceEpisode: this.lastInference && { ...this.lastInference },
      episodeSteps: this.owned ? this.env.steps : 0, episodeReturn: this.owned ? this.env.episodeReward : 0,
      parameterCount: this.agent.getModel().countParams(),
      provenance: this.provenance && structuredClone(this.provenance), curriculum: this.curriculum };
  }

  /** Train with ε-greedy exploration; resumes a paused training run. */
  train(): Promise<void> { return this.begin('training'); }
  /** Watch the agent: greedy actions, no replay, no weight update. */
  watch(): Promise<void> { return this.begin('inference'); }
  /** Waits for the in-flight transition (and its fit), then keeps the dock and the episode as they are. */
  pause(): Promise<void> { return this.command(async () => {}); }
  resume(): Promise<void> { return this.begin(this.resumeMode ?? 'training'); }
  /** Give the dock back to manual / scripted PD control; the network and counters are kept. */
  stop(): Promise<void> {
    return this.command(async () => { this.mode = 'idle'; this.resumeMode = null; this.release(); });
  }
  /** New network from the initial seeded weights; counters, curve and replay are cleared. */
  reset(): Promise<void> {
    return this.command(async () => {
      const replacement = this.createAgent();
      this.agent.dispose(); this.agent = replacement;
      this.trainingSteps = this.inferenceSteps = this.episodes = this.successes = 0;
      this.inferenceEpisodes = this.inferenceSuccesses = this.lossUpdates = this.nonFiniteLosses = 0;
      this.recent = []; this.returns = []; this.curve = []; this.lastInference = null; this.lastLoss = null; this.provenance = null;
      this.notice = ''; this.mode = 'idle'; this.resumeMode = null;
      if (this.owned) { this.env.reset(TRAINING_ENV.seed); this.runner = this.createRunner(); }
      this.release();
    });
  }
  /** Training time per chunk before yielding to rendering; takes effect on the next chunk. */
  setChunkBudget(ms: number): void {
    if (!Number.isFinite(ms) || ms < 1 || ms > 100) throw new RangeError('chunk budget must be within 1..100 ms');
    this.chunkMs = ms; this.maxStepsPerChunk = Math.max(this.maxStepsPerChunk, Math.ceil(ms * 4)); this.emit(true);
  }
  /** Deterministic stepping for tests and scripted checks; does not start the timer loop. */
  runSteps(count: number, mode: Running): Promise<void> {
    return this.command(async token => {
      if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('count must be a non-negative integer');
      this.acquire(mode);
      for (let i = 0; i < count && token === this.generation; i++) {
        await this.transition(mode);
        if (i % 16 === 15) await new Promise(resolve => setTimeout(resolve, 0));
      }
    });
  }
  /** tfjs LayersModel artifacts (topology + base64 weights) in a single JSON document. */
  async exportModel(): Promise<string> {
    let text = '';
    await this.command(async () => {
      let artifacts: tf.io.ModelArtifacts | undefined;
      await this.agent.getModel().save(tf.io.withSaveHandler(async value => {
        artifacts = value; return { modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(value) };
      }));
      if (!artifacts?.weightSpecs || !artifacts.weightData) throw new Error('Model export produced no weights.');
      const file: ModelFile = { format: MODEL_FORMAT, version: MODEL_VERSION, config: architecture(this.config),
        modelTopology: artifacts.modelTopology, weightSpecs: artifacts.weightSpecs,
        weightData: toBase64(tf.io.CompositeArrayBuffer.join(artifacts.weightData)),
        trainingSteps: this.trainingSteps, episodes: this.episodes };
      text = JSON.stringify(file);
    }, true, true);
    return text;
  }
  /** Replaces the online and target weights after validating format, architecture and finiteness. */
  importModel(json: string, options: { pretrained?: boolean } = {}): Promise<void> {
    return this.command(async () => {
      let file: ModelFile;
      try { file = JSON.parse(json) as ModelFile; } catch { throw new Error('Model file is not valid JSON.'); }
      if (!file || file.format !== MODEL_FORMAT || file.version !== MODEL_VERSION) throw new Error('Unknown model file format or version.');
      if (JSON.stringify(file.config) !== JSON.stringify(architecture(this.config))) throw new Error('Model architecture does not match this demo.');
      if (!Array.isArray(file.weightSpecs) || typeof file.weightData !== 'string') throw new Error('Model file has no weights.');
      const loaded = await tf.loadLayersModel(tf.io.fromMemory({ modelTopology: file.modelTopology as object,
        weightSpecs: file.weightSpecs, weightData: fromBase64(file.weightData) }));
      try {
        const target = this.agent.getModel().getWeights(), weights = loaded.getWeights();
        if (JSON.stringify(weights.map(w => w.shape)) !== JSON.stringify(target.map(w => w.shape))) throw new Error('Model weight shapes do not match.');
        if (weights.some(w => Array.from(w.dataSync()).some(v => !Number.isFinite(v)))) throw new Error('Model weights are not finite.');
        this.agent.getModel().setWeights(weights);
        await this.agent.updateTargetModel();
      } finally { loaded.dispose(); }
      // Only the model shipped with the demo may display a provenance; a visitor's file never does.
      this.provenance = options.pretrained ? checkProvenance(file.provenance) : null;
      // A shipped agent is meant to be watched or fine-tuned: do not restart from full exploration.
      if (this.provenance) this.agent.setState({ epsilon: Math.min(this.agent.getState().epsilon as number, this.config.minEpsilon ?? 0.05) });
      this.notice = this.provenance ? 'Agent pré-entraîné chargé : poids du réseau remplacés.'
        : 'Modèle importé : poids du réseau remplacés. Le replay et l’optimiseur repartent de zéro.';
    }, true, true);
  }
  async dispose(): Promise<void> {
    await this.command(async () => { this.release(); this.agent.dispose(); this.disposed = true; });
  }

  private begin(mode: Running): Promise<void> {
    return this.command(async token => {
      this.acquire(mode);
      this.mode = mode; this.resumeMode = null;
      if (token === this.generation) this.schedule(token);
    });
  }
  private createAgent(): DQNAgent {
    const agent = new DQNAgent({ ...this.config });
    // DQNAgent does not expose its loss: read the real Keras history of each fit call.
    const model = agent.getModel();
    const fit = model.fit.bind(model);
    model.fit = (async (...args: Parameters<typeof fit>) => {
      const history = await fit(...args);
      const loss = Number(history.history.loss?.at(-1));
      this.lastLoss = loss; this.lossUpdates++;
      if (!Number.isFinite(loss)) this.nonFiniteLosses++;
      return history;
    }) as typeof model.fit;
    return agent;
  }
  private createRunner(): IgnitionEnvTFJS {
    const runner = new IgnitionEnvTFJS(this.env); runner.agent = this.agent; return runner;
  }
  /** Take the dock: start a fresh deterministic episode if it was driven by someone else. */
  private acquire(mode: Running): void {
    if (!this.owned) { this.owned = true; this.options.onOwnership?.(true); }
    const starts = mode === 'training' ? this.curriculum ?? undefined : undefined;
    const switched = this.env.startDistance?.join() !== starts?.join();
    this.env.startDistance = starts;
    if (this.env.stale) this.env.reset(TRAINING_ENV.seed);
    else if (switched || this.env.done()) this.env.reset();
    // currentState must come from this episode's observe(), not from another driver.
    this.runner = this.createRunner();
  }
  private release(): void {
    if (!this.owned) return;
    this.owned = false; this.options.onOwnership?.(false);
  }
  private emit(immediate = false): void {
    if (this.disposed) return;
    const now = Date.now();
    if (immediate || now - this.lastEmission >= 100) { this.lastEmission = now; this.onChange?.(); }
  }
  private halt(): number {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    return ++this.generation;
  }
  /** Serializes every command after any in-flight transition (including an awaited fit). */
  private async command(operation: (token: number) => Promise<void>, stopsLoop = true, rethrow = false): Promise<void> {
    const token = this.halt();
    if (stopsLoop && (this.mode === 'training' || this.mode === 'inference')) { this.resumeMode = this.mode; this.mode = 'paused'; }
    this.pending++; this.emit(true);
    const job = this.tail.then(async () => {
      if (this.disposed) return;
      this.error = '';
      try { await operation(token); }
      catch (error) { this.halt(); if (this.mode !== 'idle') this.mode = 'paused'; this.error = message(error); if (rethrow) throw error; }
    });
    this.tail = job.catch(() => {});
    try { await job; } finally { this.pending--; this.emit(true); }
  }
  private schedule(token: number): void {
    const mode = this.mode;
    if (mode !== 'training' && mode !== 'inference') return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      const job = this.tail.then(async () => {
        if (token !== this.generation || this.disposed) return;
        try {
          const deadline = Date.now() + this.chunkMs;
          let count = 0;
          do { await this.transition(mode); count++; }
          while (mode === 'training' && token === this.generation && count < this.maxStepsPerChunk && Date.now() < deadline);
          if (token === this.generation) this.schedule(token);
        } catch (error) {
          this.halt(); this.resumeMode = mode; this.mode = 'paused'; this.error = message(error); this.emit(true);
        }
      });
      this.tail = job.catch(() => {});
    }, mode === 'training' ? 0 : this.inferenceIntervalMs);
  }
  private async transition(mode: Running): Promise<void> {
    const result = await (mode === 'training' ? this.runner.step() : this.runner.inferStep());
    if (mode === 'training') this.trainingSteps++; else this.inferenceSteps++;
    if ((result.terminated || result.truncated) && this.env.lastEpisode) {
      const episode = { ...this.env.lastEpisode };
      if (mode === 'training') {
        this.episodes++; if (episode.outcome === 'success') this.successes++;
        this.recent = [...this.recent.slice(1 - SESSION_DEFAULTS.recentEpisodes), episode];
        this.returns = [...this.returns.slice(1 - SESSION_DEFAULTS.curveWindow), episode.return];
        this.curve = [...this.curve.slice(1 - SESSION_DEFAULTS.curvePoints),
          this.returns.reduce((sum, value) => sum + value, 0) / this.returns.length];
      } else {
        this.inferenceEpisodes++; if (episode.outcome === 'success') this.inferenceSuccesses++;
        this.lastInference = episode;
      }
    }
    this.emit();
  }
}
