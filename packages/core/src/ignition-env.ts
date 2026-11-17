import { AgentInterface, AgentFactory, AlgorithmType, StepResult, TrainingEnv } from './types.js';
import { validateTrainingEnv } from './env-validation.js';
import { mergeDefaults } from './defaults.js';

export class IgnitionEnv {
  private env: TrainingEnv;
  private _agent: AgentInterface | null = null;
  private currentState: number[];
  private mode: 'train' | 'infer' | null = null;
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private transitionTail: Promise<void> = Promise.resolve();
  /** Most recent automatic-loop failure; cleared when a new loop starts. */
  public lastError: Error | null = null;
  public stepCount = 0;

  /** Milliseconds between steps. Lower = faster training. Default 50ms (20 steps/sec). */
  public stepIntervalMs = 50;

  /** Number of steps to run per tick. >1 = batch multiple steps before yielding to the event loop. */
  public stepsPerTick = 1;

  protected factories: Record<string, AgentFactory> = {};
  protected algorithmDefaults: Record<string, Record<string, unknown>> = {};
  private currentAlgorithm: AlgorithmType | null = null;

  constructor(env: TrainingEnv) {
    validateTrainingEnv(env);
    this.env = env;
    this.currentState = env.observe();
  }

  get agent(): AgentInterface | null {
    return this._agent;
  }

  set agent(value: AgentInterface | null) {
    this._agent = value;
  }

  public train(algorithm?: AlgorithmType, overrides?: Record<string, unknown>): void {
    const algo = algorithm ?? 'dqn';

    if (this._agent && (!this.currentAlgorithm || this.currentAlgorithm === algo)) {
      if (overrides !== undefined) {
        throw new Error('[IgnitionEnv] An agent already exists. Overrides only apply at creation; resume without options or create a new runner.');
      }
      this.start();
      return;
    }

    const factory = this.factories[algo];
    if (!factory) {
      throw new Error(`[IgnitionEnv] Unknown algorithm "${algo}". Available: ${Object.keys(this.factories).join(', ') || 'none (import from @ignitionai/backend-tfjs)'}`);
    }
    const inputSize = this.currentState.length;
    const actionSize = typeof this.env.actions === 'number' ? this.env.actions : this.env.actions.length;
    const defaults = this.algorithmDefaults[algo] ?? {};
    const replacement = factory(mergeDefaults(defaults, { ...overrides, inputSize, actionSize }));
    const previous = this._agent;
    this.stop();
    this._agent = replacement;
    this.currentAlgorithm = algo;
    if (previous) {
      void this.transitionTail.then(() => previous.dispose?.()).catch(error => {
        this.lastError = error instanceof Error ? error : new Error(String(error));
      });
    }

    this.start();
  }

  public step(): Promise<StepResult> {
    return this.enqueueTransition(() => this.performStep(false));
  }

  public inferStep(): Promise<StepResult> {
    return this.enqueueTransition(() => this.performStep(true));
  }

  private enqueueTransition<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.transitionTail.then(operation);
    this.transitionTail = result.then(() => undefined, () => undefined);
    return result;
  }

  private async performStep(greedy: boolean): Promise<StepResult> {
    const agent = this._agent;
    if (!agent) throw new Error('[IgnitionEnv] No agent. Call train() first.');
    this.stepCount++;
    if (greedy) agent.discardRollout?.();
    const action = await agent.getAction(this.currentState, greedy);
    this.env.step(action);
    const observation = this.env.observe();
    const reward = this.env.reward();
    const truncated = this.env.truncated?.() ?? false;
    const terminated = this.env.terminated?.() ?? (this.env.done() && !truncated);
    if (!greedy) {
      agent.remember({ state: this.currentState, action, reward, nextState: observation, terminated, truncated });
      if (agent.shouldTrain?.() ?? true) await agent.train();
    }
    if (terminated || truncated) {
      this.env.reset();
      this.currentState = this.env.observe();
    } else {
      this.currentState = observation;
    }
    return { observation, reward, terminated, truncated };
  }

  public infer(): void {
    if (!this._agent) throw new Error('[IgnitionEnv] No agent. Call train() first to create an agent.');
    this.startLoop('infer');
  }

  public start(): void {
    this.startLoop('train');
  }

  private startLoop(mode: 'train' | 'infer'): void {
    if (this.mode === mode) return;
    this.stop();
    this.mode = mode;
    this.lastError = null;
    this.scheduleTick(this.generation, mode);
  }

  private scheduleTick(generation: number, mode: 'train' | 'infer'): void {
    this.timer = setTimeout(() => { void this.runTick(generation, mode); }, this.stepIntervalMs);
  }

  private async runTick(generation: number, mode: 'train' | 'infer'): Promise<void> {
    try {
      for (let i = 0; i < this.stepsPerTick; i++) {
        if (generation !== this.generation) return;
        await this.enqueueTransition(async () => {
          if (generation === this.generation) await this.performStep(mode === 'infer');
        });
      }
      if (generation === this.generation) this.scheduleTick(generation, mode);
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      if (generation === this.generation) this.stop();
    }
  }

  public stop(): void {
    this.mode = null;
    this.generation++;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  public reset(): void {
    this._agent?.discardRollout?.();
    this.env.reset();
    this.currentState = this.env.observe();
    this.stepCount = 0;
  }

  /**
   * Set training speed. Multiplier: 1x = normal (50ms, 1 step/tick), 10x = fast, 50x = turbo.
   */
  public setSpeed(multiplier: number): void {
    if (multiplier <= 1) {
      this.stepIntervalMs = 50;
      this.stepsPerTick = 1;
    } else if (multiplier <= 10) {
      this.stepIntervalMs = 10;
      this.stepsPerTick = Math.round(multiplier);
    } else {
      // Turbo: minimal interval, batch many steps
      this.stepIntervalMs = 1;
      this.stepsPerTick = Math.round(multiplier / 2);
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  /**
   * Save the current agent model + training state.
   * Requires the agent to implement `save()`.
   */
  async save(modelId: string, metadata?: Record<string, unknown>): Promise<string | void> {
    if (!this._agent?.save) {
      throw new Error('[IgnitionEnv] Agent does not support persistence. Use a backend that implements save().');
    }
    const meta = {
      algorithm: this.currentAlgorithm,
      stepCount: this.stepCount,
      ...(this._agent.getState?.() ?? {}),
      ...metadata,
    };
    return this._agent.save(modelId, meta);
  }

  /**
   * Load a previously saved agent model + training state.
   * Requires the agent to implement `load()`.
   */
  async load(modelId: string): Promise<void> {
    if (!this._agent?.load) {
      throw new Error('[IgnitionEnv] Agent does not support persistence. Use a backend that implements load().');
    }
    await this._agent.load(modelId);
    // Restore agent internal state if getState/setState are available
    // (state is typically embedded in metadata and restored by the agent's load())
    this.stepCount = 0;
  }
}
