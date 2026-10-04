import {
  validateContinuousAction, validateContinuousEnv, validateContinuousVector,
  type ContinuousActionBounds, type ContinuousAgent, type ContinuousTrainingEnv,
} from './continuous.js';
import type { StepResult } from './types.js';

export interface ContinuousStepResult extends StepResult {
  action: number[];
}

/** Serializes continuous transitions. The caller owns and disposes the agent. */
export class ContinuousRunner {
  readonly bounds: ContinuousActionBounds;
  private observation: number[];
  private tail: Promise<void> = Promise.resolve();
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private mode: 'train' | 'infer' | undefined;
  lastError: Error | null = null;
  stepIntervalMs = 50;

  constructor(private readonly env: ContinuousTrainingEnv, readonly agent: ContinuousAgent) {
    const contract = validateContinuousEnv(env);
    this.bounds = contract.bounds;
    this.observation = contract.observation;
  }

  step(): Promise<ContinuousStepResult> {
    return this.enqueue(() => this.transition(false));
  }

  inferStep(): Promise<ContinuousStepResult> {
    return this.enqueue(() => this.transition(true));
  }

  /** Stops future automatic ticks; await it to drain an already active transition. */
  stop(): Promise<void> {
    this.generation++;
    this.mode = undefined;
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    return this.tail;
  }

  reset(): Promise<void> {
    void this.stop();
    return this.enqueue(async () => {
      this.env.reset();
      this.observation = this.readObservation();
    });
  }

  train(): void { this.start('train'); }
  infer(): void { this.start('infer'); }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(operation);
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }

  private readObservation(): number[] {
    return validateContinuousVector(this.env.observe(), this.observation.length, 'Observation');
  }

  private async transition(greedy: boolean): Promise<ContinuousStepResult> {
    const state = [...this.observation];
    const action = validateContinuousAction(await this.agent.getAction([...state], greedy), this.bounds);
    this.env.step([...action]);
    const observation = this.readObservation(), reward = this.env.reward();
    const terminated = this.env.terminated(), truncated = this.env.truncated();
    if (!Number.isFinite(reward) || typeof terminated !== 'boolean' || typeof truncated !== 'boolean') {
      throw new Error('[Continuous] Reward must be finite and episode flags must be boolean');
    }
    if (terminated || truncated) this.env.reset();
    this.observation = terminated || truncated ? this.readObservation() : [...observation];
    if (!greedy) {
      this.agent.remember({ state, action: [...action], nextState: [...observation], reward, terminated, truncated });
      await this.agent.train();
    }
    return { observation, action, reward, terminated, truncated };
  }

  private start(mode: 'train' | 'infer'): void {
    if (!Number.isFinite(this.stepIntervalMs) || this.stepIntervalMs < 0) {
      throw new Error('[Continuous] Step interval must be finite and nonnegative');
    }
    if (this.mode === mode) return;
    void this.stop();
    this.mode = mode;
    this.lastError = null;
    this.schedule(this.generation, mode);
  }

  private schedule(generation: number, mode: 'train' | 'infer'): void {
    this.timer = setTimeout(() => { void this.tick(generation, mode); }, this.stepIntervalMs);
  }

  private async tick(generation: number, mode: 'train' | 'infer'): Promise<void> {
    try {
      await this.enqueue(async () => {
        if (generation === this.generation) await this.transition(mode === 'infer');
      });
      if (generation === this.generation) this.schedule(generation, mode);
    } catch (error) {
      if (generation === this.generation) {
        this.lastError = error instanceof Error ? error : new Error(String(error));
        void this.stop();
      }
    }
  }
}
