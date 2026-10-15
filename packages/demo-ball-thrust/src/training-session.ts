import * as tf from '@tensorflow/tfjs';
import { DQNAgent, IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { IndexedDBProvider, type ModelStorageProvider } from '@ignitionai/storage';
import { BallThrustEnv, type EpisodeSummary } from './ball-thrust-env';
import { DQN_CONFIG, TRAINING_PROTOCOL, evaluatePolicies, type EvaluationReport } from './evaluation';
export { TRAINING_PROTOCOL } from './evaluation';

export const MODEL_ID = 'ball-thrust-dqn-v1';
type Mode = 'manual' | 'training' | 'inference' | 'paused';
export interface SessionSnapshot {
  mode: Mode; busy: boolean; error: string; notice: string;
  telemetry: BallThrustEnv['telemetry']; seed: number;
  trainingSteps: number; inferenceSteps: number; trainingEpisodes: number; trainingSuccesses: number;
  epsilon: number; updates: number; fingerprint: string; changedWeights: boolean; parameterCount: number;
  recentEpisodes: EpisodeSummary[]; evaluation: EvaluationReport | null; budgetReached: boolean;
}

/** Full copies, not tensor references: getWeights() returns live model variables. */
export function weightValues(agent: DQNAgent): number[] {
  return agent.getModel().getWeights().flatMap(weight => Array.from(weight.dataSync()));
}
function fingerprint(values: number[]): string {
  let hash = 2166136261;
  const bytes = new Uint8Array(new Float32Array(values).buffer);
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
function counter(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > max) {
    throw new Error('Invalid checkpoint counter.');
  }
  return value;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid checkpoint metadata.');
  return value as Record<string, unknown>;
}

/** Main must initialize Rapier and the TF.js CPU backend before construction. */
export class TrainingSession {
  public agent: DQNAgent;
  public onChange?: () => void;
  public manualAction: () => number = () => 0;
  private runner: IgnitionEnvTFJS;
  private mode: Mode = 'paused';
  private error = '';
  private notice = '';
  private trainingSteps = 0;
  private inferenceSteps = 0;
  private trainingEpisodes = 0;
  private trainingSuccesses = 0;
  private recentEpisodes: EpisodeSummary[] = [];
  private evaluation: EvaluationReport | null = null;
  private initialWeights: number[];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private tail: Promise<void> = Promise.resolve();
  private generation = 0;
  private pending = 0;
  private disposed = false;
  private lastEmission = 0;
  // A checkpoint cannot roll back transitions already spent by this session.
  private spent = 0;

  constructor(public readonly env: BallThrustEnv, private readonly storage: ModelStorageProvider = new IndexedDBProvider(),
    private readonly budget: number = TRAINING_PROTOCOL.budget) {
    counter(budget, TRAINING_PROTOCOL.budget);
    if (budget < 1) throw new Error('Training budget must be positive.');
    this.agent = this.createAgent();
    this.initialWeights = weightValues(this.agent);
    this.runner = this.createRunner();
  }

  snapshot(): SessionSnapshot {
    const weights = weightValues(this.agent);
    const state = this.agent.getState();
    return { mode: this.mode, busy: this.pending > 0, error: this.error, notice: this.notice,
      telemetry: this.env.telemetry, seed: this.env.seed, trainingSteps: this.trainingSteps,
      inferenceSteps: this.inferenceSteps, trainingEpisodes: this.trainingEpisodes, trainingSuccesses: this.trainingSuccesses,
      epsilon: state.epsilon as number, updates: state.trainStepCounter as number, fingerprint: fingerprint(weights),
      changedWeights: weights.some((w, i) => w !== this.initialWeights[i]), parameterCount: weights.length,
      recentEpisodes: this.recentEpisodes.map(e => ({ ...e })), evaluation: this.evaluation,
      budgetReached: this.spent >= this.budget };
  }

  async start(mode: Exclude<Mode, 'paused'>): Promise<void> {
    return this.command(async token => {
      if (!['manual', 'training', 'inference'].includes(mode)) throw new Error('Invalid session mode.');
      this.prepare();
      if (mode === 'training' && this.spent >= this.budget) { this.notice = 'Training budget reached.'; return; }
      if (token !== this.generation) return;
      this.mode = mode;
      this.schedule(token);
    });
  }
  async pause(): Promise<void> { return this.command(async () => {}); }
  async newEpisode(seed: number): Promise<void> {
    return this.command(async () => { this.env.reset(seed); this.runner = this.createRunner(); });
  }
  async newNetwork(): Promise<void> {
    return this.command(async () => {
      const replacement = this.createAgent();
      this.agent.dispose(); this.agent = replacement;
      this.initialWeights = weightValues(this.agent);
      this.trainingSteps = this.inferenceSteps = this.trainingEpisodes = this.trainingSuccesses = this.spent = 0;
      this.recentEpisodes = []; this.evaluation = null; this.notice = '';
      this.env.reset(TRAINING_PROTOCOL.environmentSeed); this.runner = this.createRunner();
    });
  }
  async runSteps(count: number, mode: 'training' | 'inference'): Promise<void> {
    return this.command(async token => {
      counter(count);
      if (mode !== 'training' && mode !== 'inference') throw new Error('Invalid step mode.');
      this.prepare();
      for (let i = 0; i < count && token === this.generation; i++) {
        if (mode === 'training' && this.spent >= this.budget) break;
        await this.transition(mode);
        if (i % 4 === 3) await new Promise(resolve => setTimeout(resolve, 0));
      }
    });
  }
  async save(): Promise<void> {
    return this.command(async () => {
      const state = this.agent.getState();
      // DQN initializes bestReward at -Infinity: encode the unset sentinel explicitly.
      await this.agent.saveModel(MODEL_ID, { version: TRAINING_PROTOCOL.version, config: DQN_CONFIG,
        shapes: this.agent.getModel().getWeights().map(w => w.shape),
        state: { ...state, bestReward: state.bestReward === -Infinity ? null : state.bestReward },
        trainingSteps: this.trainingSteps, inferenceSteps: this.inferenceSteps,
        trainingEpisodes: this.trainingEpisodes, trainingSuccesses: this.trainingSuccesses, spent: this.spent });
      this.notice = 'Checkpoint saved. Replay and optimizer state are not persisted.';
    });
  }
  async load(): Promise<void> {
    return this.command(async () => {
      const metadata = record((await this.storage.list()).find(info => info.modelId === MODEL_ID)?.metadata);
      if (metadata.version !== TRAINING_PROTOCOL.version || JSON.stringify(metadata.config) !== JSON.stringify(DQN_CONFIG)) {
        throw new Error('Incompatible checkpoint configuration/version.');
      }
      const trainingSteps = counter(metadata.trainingSteps, this.budget);
      const inferenceSteps = counter(metadata.inferenceSteps);
      const trainingEpisodes = counter(metadata.trainingEpisodes, trainingSteps);
      const trainingSuccesses = counter(metadata.trainingSuccesses, trainingEpisodes);
      const spent = counter(metadata.spent, this.budget);
      if (spent < trainingSteps) throw new Error('Inconsistent checkpoint budget.');
      const state = record(metadata.state);
      counter(state.trainStepCounter, trainingSteps);
      if (typeof state.epsilon !== 'number' || !Number.isFinite(state.epsilon) || state.epsilon < 0 || state.epsilon > 1
        || (state.bestReward !== null && (typeof state.bestReward !== 'number' || !Number.isFinite(state.bestReward)))) {
        throw new Error('Invalid checkpoint agent state.');
      }
      const shapes = this.agent.getModel().getWeights().map(w => w.shape);
      if (JSON.stringify(metadata.shapes) !== JSON.stringify(shapes)) throw new Error('Invalid checkpoint shapes.');
      // Validate the actual artifact before DQN.loadModel can replace even the candidate model.
      const candidate = this.createAgent({
        save: (...args) => this.storage.save(...args), list: () => this.storage.list(),
        delete: id => this.storage.delete(id),
        exists: async () => { throw new Error('Use checkpoint metadata, not existence probes.'); },
        load: async id => {
        const model = await this.storage.load(id);
        try {
          if (JSON.stringify(model.getWeights().map(w => w.shape)) !== JSON.stringify(shapes)
            || model.getWeights().some(w => Array.from(w.dataSync()).some(v => !Number.isFinite(v)))
            || model.inputs[0]?.shape[1] !== 21 || model.outputs[0]?.shape[1] !== 9) {
            throw new Error('Invalid checkpoint model weights/shape.');
          }
          return model;
        } catch (error) { model.optimizer?.dispose(); model.dispose(); throw error; }
      } });
      try {
        await candidate.loadModel(MODEL_ID);
        // IndexedDB model.save() does not persist optimizer slots. Some artifacts
        // also omit trainingConfig: make resumed fit possible without backend changes.
        if (!candidate.getModel().optimizer) {
          candidate.getModel().compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
        }
        candidate.setState({ ...state, bestReward: state.bestReward === null ? -Infinity : state.bestReward });
      } catch (error) { candidate.dispose(); throw error; }
      this.agent.dispose(); this.agent = candidate;
      this.trainingSteps = trainingSteps; this.inferenceSteps = inferenceSteps;
      this.trainingEpisodes = trainingEpisodes; this.trainingSuccesses = trainingSuccesses;
      this.spent = Math.max(this.spent, spent);
      this.recentEpisodes = []; this.evaluation = null; this.runner = this.createRunner();
      this.notice = 'Checkpoint loaded. Replay is empty; optimizer/RNG state is not restored.';
    });
  }
  async evaluate(): Promise<EvaluationReport> {
    let report: EvaluationReport | undefined;
    await this.command(async () => { report = await evaluatePolicies(this.agent); this.evaluation = report; }, true);
    return report!;
  }
  async dispose(): Promise<void> {
    return this.command(async () => {
      this.agent.dispose(); this.env.dispose(); this.disposed = true;
    });
  }

  private createAgent(storage = this.storage): DQNAgent { return new DQNAgent({ ...DQN_CONFIG, storageProvider: storage }); }
  private createRunner(): IgnitionEnvTFJS {
    const runner = new IgnitionEnvTFJS(this.env); runner.agent = this.agent; return runner;
  }
  private prepare(): void {
    if (this.env.done()) this.env.reset();
    // Manual steps bypass the runner: reconstruct currentState from observe(), without reset.
    this.runner = this.createRunner();
  }
  private emit(immediate = false): void {
    if (this.disposed) return;
    if (immediate || Date.now() - this.lastEmission >= 100) {
      this.lastEmission = Date.now(); this.onChange?.();
    }
  }
  private halt(): number {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined; this.mode = 'paused'; return ++this.generation;
  }
  private async command(operation: (token: number) => Promise<void>, rethrow = false): Promise<void> {
    const token = this.halt(); this.pending++; this.emit(true);
    const job = this.tail.then(async () => {
      if (this.disposed) return;
      this.error = '';
      try { await operation(token); }
      catch (error) { this.halt(); this.error = error instanceof Error ? error.message : String(error); if (rethrow) throw error; }
      finally { this.emit(true); }
    });
    this.tail = job.catch(() => {});
    try { await job; } finally { this.pending--; this.emit(true); }
  }
  private schedule(token: number): void {
    this.timer = setTimeout(() => {
      this.timer = undefined;
      const job = this.tail.then(async () => {
        try {
          const mode = this.mode;
          for (let i = 0; i < (mode === 'training' ? 4 : 1) && token === this.generation; i++) {
            if (mode === 'paused') break;
            if (mode === 'training' && this.spent >= this.budget) { this.halt(); this.notice = 'Training budget reached.'; this.emit(true); break; }
            await this.transition(mode);
          }
          if (token === this.generation) this.schedule(token);
        } catch (error) { this.halt(); this.error = error instanceof Error ? error.message : String(error); this.emit(true); }
      });
      this.tail = job.catch(() => {});
    }, this.mode === 'training' ? 0 : 100);
  }
  private async transition(mode: Exclude<Mode, 'paused'>): Promise<void> {
    if (mode === 'manual') {
      if (!this.env.done()) this.env.step(this.manualAction());
    } else {
      // Reserve budget before awaiting fit: a rejected fit has already advanced physics.
      if (mode === 'training') this.spent++;
      const previousSteps = this.env.steps;
      const previousEpisode = this.env.lastEpisode;
      let result;
      try { result = await (mode === 'training' ? this.runner.step() : this.runner.inferStep()); }
      finally {
        if (mode === 'training' && (this.env.steps !== previousSteps || this.env.lastEpisode !== previousEpisode)) {
          this.trainingSteps++;
        }
      }
      if (mode === 'training') {
        if ((result.terminated || result.truncated) && this.env.lastEpisode) {
          this.trainingEpisodes++;
          if (this.env.lastEpisode.outcome === 'success') this.trainingSuccesses++;
          this.recentEpisodes = [...this.recentEpisodes.slice(-19), { ...this.env.lastEpisode }];
        }
      } else this.inferenceSteps++;
    }
    this.emit();
  }
}
