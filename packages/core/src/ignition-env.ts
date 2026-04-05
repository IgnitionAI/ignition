import {
  AgentInterface,
  Experience,
} from './types';

export interface IgnitionEnvConfig {
  agent: AgentInterface;

  getObservation: () => number[];
  applyAction: (action: number | number[]) => void;
  computeReward: () => number;
  isDone: () => boolean;
  onReset?: () => void;

  stepIntervalMs?: number;
  hfRepoId?: string;
  hfToken?: string;
}

export class IgnitionEnv {
  private config: IgnitionEnvConfig;
  private agent: AgentInterface;
  private currentState: number[];
  private isRunning: boolean = false;
  public stepCount: number = 0;

  constructor(config: IgnitionEnvConfig) {
    this.config = config;
    this.agent = config.agent;
    this.currentState = config.getObservation();
  }

  public async step(): Promise<void> {
    this.stepCount++;

    const action = await this.agent.getAction(this.currentState);
    this.config.applyAction(action);

    const nextState = this.config.getObservation();
    const reward = this.config.computeReward();
    const done = this.config.isDone();

    const experience: Experience = {
      state: this.currentState,
      action,
      reward,
      nextState,
      done,
    };

    this.agent.remember(experience);
    await this.agent.train();

    if ('maybeSaveBestCheckpoint' in this.agent && this.config.hfRepoId && this.config.hfToken) {
      await (this.agent as any).maybeSaveBestCheckpoint(
        this.config.hfRepoId,
        this.config.hfToken,
        reward,
        this.stepCount
      );
    }

    if (done) {
      this.config.onReset?.();
      this.currentState = this.config.getObservation();
    } else {
      this.currentState = nextState;
    }
  }

  /**
   * Start the training loop using an async recursive loop.
   * - Avoids setInterval accumulation: if step() takes longer than stepIntervalMs,
   *   the next step starts immediately without stacking callbacks.
   * - isRunning flag prevents double-start.
   */
  public async start(auto: boolean = true): Promise<void> {
    if (!auto || this.isRunning) return;
    this.isRunning = true;
    const intervalMs = this.config.stepIntervalMs ?? 100;

    while (this.isRunning) {
      const t0 = Date.now();
      await this.step();
      const elapsed = Date.now() - t0;
      const remaining = intervalMs - elapsed;
      // Only wait if the step finished faster than the target interval
      if (remaining > 0) {
        await new Promise<void>(resolve => setTimeout(resolve, remaining));
      }
    }
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
