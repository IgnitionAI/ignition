import { AgentInterface, Experience, StepResult } from './types';

// ─── Callbacks ───────────────────────────────────────────────────────────────

export interface IgnitionEnvCallbacks {
  onStep?: (result: StepResult, stepCount: number) => void | Promise<void>;
  onEpisodeEnd?: (stepCount: number) => void | Promise<void>;
  onTrainEnd?: () => void | Promise<void>;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface IgnitionEnvConfig {
  agent: AgentInterface;

  getObservation: () => number[];
  applyAction: (action: number | number[]) => void;
  computeReward: () => number;
  /** Returns true when the episode ends due to a terminal condition */
  isTerminated: () => boolean;
  /** Returns true when the episode ends due to a time/step limit (optional) */
  isTruncated?: () => boolean;
  onReset?: () => void;

  stepIntervalMs?: number;
  callbacks?: IgnitionEnvCallbacks;
}

// ─── Environment ─────────────────────────────────────────────────────────────

export class IgnitionEnv {
  private config: IgnitionEnvConfig;
  private agent: AgentInterface;
  private currentState: number[];
  private isRunning = false;
  public stepCount = 0;

  constructor(config: IgnitionEnvConfig) {
    this.config = config;
    this.agent = config.agent;
    this.currentState = config.getObservation();
  }

  public async step(): Promise<StepResult> {
    this.stepCount++;

    const action = await this.agent.getAction(this.currentState);
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

    this.agent.remember(experience);
    await this.agent.train();

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
