import { AgentInterface, AgentFactory, AlgorithmType, Experience, StepResult, TrainingEnv } from './types';
import { validateTrainingEnv } from './env-validation';
import { mergeDefaults } from './defaults';

export class IgnitionEnv {
  private env: TrainingEnv;
  private _agent: AgentInterface | null = null;
  private currentState: number[];
  private isRunning = false;
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

  public train(algorithm?: AlgorithmType, overrides?: Record<string, unknown>): void {
    const algo = algorithm ?? 'dqn';

    if (this.isRunning && this.currentAlgorithm === algo && !overrides) {
      return;
    }

    if (this._agent && this.currentAlgorithm && this.currentAlgorithm !== algo) {
      this._agent.dispose?.();
      this._agent = null;
    }

    if (!this._agent) {
      const inputSize = this.currentState.length;
      const actionSize = typeof this.env.actions === 'number'
        ? this.env.actions
        : this.env.actions.length;

      const factory = this.factories[algo];
      if (!factory) {
        throw new Error(
          `[IgnitionEnv] Unknown algorithm "${algo}". ` +
          `Available: ${Object.keys(this.factories).join(', ') || 'none (import from @ignitionai/backend-tfjs)'}`,
        );
      }

      const defaults = this.algorithmDefaults[algo] ?? {};
      const merged = mergeDefaults(defaults, { ...overrides, inputSize, actionSize });
      this._agent = factory(merged);
      this.currentAlgorithm = algo;
    }

    this.start();
  }

  public async step(): Promise<StepResult> {
    if (!this._agent) {
      throw new Error('[IgnitionEnv] No agent. Call train() first.');
    }

    this.stepCount++;

    const action = await this._agent.getAction(this.currentState);
    this.env.step(action);

    const observation = this.env.observe();
    const reward = this.env.reward();
    const terminated = this.env.done();

    const experience: Experience = {
      state: this.currentState,
      action,
      reward,
      nextState: observation,
      terminated,
      truncated: false,
    };

    this._agent.remember(experience);
    await this._agent.train();

    const result: StepResult = { observation, reward, terminated, truncated: false };

    if (terminated) {
      this.env.reset();
      this.currentState = this.env.observe();
    } else {
      this.currentState = observation;
    }

    return result;
  }

  public async inferStep(): Promise<StepResult> {
    if (!this._agent) {
      throw new Error('[IgnitionEnv] No agent. Call train() first, then infer().');
    }

    this.stepCount++;

    const action = await this._agent.getAction(this.currentState, true);
    this.env.step(action);

    const observation = this.env.observe();
    const reward = this.env.reward();
    const terminated = this.env.done();

    const result: StepResult = { observation, reward, terminated, truncated: false };

    if (terminated) {
      this.env.reset();
      this.currentState = this.env.observe();
    } else {
      this.currentState = observation;
    }

    return result;
  }

  public infer(): void {
    if (!this._agent) {
      throw new Error('[IgnitionEnv] No agent. Call train() first to create an agent.');
    }
    if (this.isRunning) this.stop();

    this.isRunning = true;

    const loop = async (): Promise<void> => {
      if (!this.isRunning) return;
      for (let i = 0; i < this.stepsPerTick; i++) {
        if (!this.isRunning) return;
        await this.inferStep();
      }
      setTimeout(loop, this.stepIntervalMs);
    };

    setTimeout(loop, this.stepIntervalMs);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const loop = async (): Promise<void> => {
      if (!this.isRunning) return;
      for (let i = 0; i < this.stepsPerTick; i++) {
        if (!this.isRunning) return;
        await this.step();
      }
      setTimeout(loop, this.stepIntervalMs);
    };

    setTimeout(loop, this.stepIntervalMs);
  }

  public stop(): void {
    this.isRunning = false;
  }

  public reset(): void {
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
}
