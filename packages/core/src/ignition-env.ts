import { AgentInterface, AgentFactory, AlgorithmType, Experience, StepResult } from './types';
import { IgnitionEnvConfig, IgnitionEnvConfigSchema } from './schemas';
import { mergeDefaults } from './defaults';

export type { IgnitionEnvConfig };

// ─── Environment ─────────────────────────────────────────────────────────────

export class IgnitionEnv {
  protected config: IgnitionEnvConfig;
  private _agent: AgentInterface | null;
  private currentState: number[];
  private isRunning = false;
  public stepCount = 0;

  /** Agent factories registered by subclasses (e.g. IgnitionEnvTFJS) */
  protected factories: Record<string, AgentFactory> = {};
  /** Default hyperparameters per algorithm, registered by subclasses */
  protected algorithmDefaults: Record<string, Record<string, unknown>> = {};
  /** The algorithm currently in use */
  private currentAlgorithm: AlgorithmType | null = null;

  constructor(config: IgnitionEnvConfig) {
    const result = IgnitionEnvConfigSchema.safeParse(config);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      throw new Error(`[IgnitionEnv] Invalid config: ${messages}`);
    }
    this.config = config;
    this._agent = config.agent ?? null;
    this.currentState = config.getObservation();
  }

  /** The current agent. Null before train() is called (when no explicit agent provided). */
  get agent(): AgentInterface | null {
    return this._agent;
  }

  /**
   * Auto-create an agent and start training.
   * Deduces inputSize from getObservation().length and actionSize from config.actions.
   *
   * @param algorithm - 'dqn' | 'ppo' | 'qtable' (default: 'dqn')
   * @param overrides - partial hyperparameter overrides merged with defaults
   */
  public train(algorithm?: AlgorithmType, overrides?: Record<string, unknown>): void {
    const algo = algorithm ?? 'dqn';

    // If already training with the same algo and no new overrides, resume
    if (this.isRunning && this.currentAlgorithm === algo && !overrides) {
      return; // idempotent
    }

    // If switching algorithms, dispose old agent
    if (this._agent && this.currentAlgorithm && this.currentAlgorithm !== algo) {
      this._agent.dispose?.();
      this._agent = null;
    }

    // Create agent if needed
    if (!this._agent) {
      const inputSize = this.currentState.length;
      const actionSize = this.deduceActionSize();

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

  private deduceActionSize(): number {
    const actions = this.config.actions;
    if (actions === undefined) {
      throw new Error('[IgnitionEnv] Cannot auto-create agent: "actions" not provided in config. Specify actions as a number or string[].');
    }
    if (typeof actions === 'number') return actions;
    return actions.length;
  }

  public async step(): Promise<StepResult> {
    if (!this._agent) {
      throw new Error('[IgnitionEnv] No agent. Call train() or provide an agent in config.');
    }

    this.stepCount++;

    const action = await this._agent.getAction(this.currentState);
    this.config.applyAction(action);

    const observation = this.config.getObservation();
    const reward = this.config.computeReward();
    const terminated = this.config.isTerminated();
    const truncated = this.config.isTruncated?.() ?? false;

    const experience: Experience = {
      state: this.currentState,
      action,
      reward,
      nextState: observation,
      terminated,
      truncated,
    };

    this._agent.remember(experience);
    await this._agent.train();

    const result: StepResult = { observation, reward, terminated, truncated };

    await this.config.callbacks?.onStep?.(result, this.stepCount);

    if (terminated || truncated) {
      await this.config.callbacks?.onEpisodeEnd?.(this.stepCount);
      this.config.onReset?.();
      this.currentState = this.config.getObservation();
    } else {
      this.currentState = observation;
    }

    return result;
  }

  public start(auto = true): void {
    if (!auto || this.isRunning) return;
    this.isRunning = true;
    const interval = this.config.stepIntervalMs ?? 100;

    const loop = async (): Promise<void> => {
      if (!this.isRunning) return;
      await this.step();
      setTimeout(loop, interval);
    };

    setTimeout(loop, interval);
  }

  public stop(): void {
    this.isRunning = false;
  }

  public reset(): void {
    this.config.onReset?.();
    this.currentState = this.config.getObservation();
    this.stepCount = 0;
  }
}
