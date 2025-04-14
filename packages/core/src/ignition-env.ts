import { AgentInterface, Experience } from './types';

export interface IgnitionEnvConfig {
  agent: AgentInterface;

  getObservation: () => number[];
  applyAction: (action: number) => void;
  computeReward: () => number;
  isDone: () => boolean;
  onReset?: () => void;

  stepIntervalMs?: number;
  // 👉 NEW: Save best checkpoint automatically
  hfRepoId?: string;
  hfToken?: string;
}

export class IgnitionEnv {
  private config: IgnitionEnvConfig;
  private agent: AgentInterface;
  private currentState: number[];
  private intervalId?: ReturnType<typeof setInterval>;
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
    // ✅ Save best checkpoint if reward is best so far
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

  public start(auto: boolean = true) {
    if (!auto) return;
    const interval = this.config.stepIntervalMs ?? 100;
    this.intervalId = setInterval(() => this.step(), interval);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  public reset() {
    this.config.onReset?.();
    this.currentState = this.config.getObservation();
  }
}
