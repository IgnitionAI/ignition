import type { AgentInterface, Experience } from './types';

export type AgentId = string;
export type MultiAgentAction = number | number[];

/** A simultaneous-action world. Finished agents must retain their final observation until reset. */
export interface MultiAgentEnv {
  readonly agentIds: readonly AgentId[];
  activeAgentIds(): readonly AgentId[];
  observe(id: AgentId): number[];
  step(actions: ReadonlyMap<AgentId, MultiAgentAction>): void;
  reward(id: AgentId): number;
  terminated(id: AgentId): boolean;
  truncated(id: AgentId): boolean;
  /** A global boundary also truncates agents that have not individually finished. */
  done(): boolean;
  reset(): void;
}

export interface MultiAgentStepResult {
  transitions: ReadonlyMap<AgentId, Experience>;
  episodeEnded: boolean;
}

/** Policies are caller-owned. This runner never disposes or implicitly shares them. */
export class MultiAgentRunner {
  private readonly policies: Map<AgentId, AgentInterface>;
  private readonly retired = new Set<AgentId>();
  private tail: Promise<void> = Promise.resolve();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  public stepCount = 0;
  public lastError: Error | null = null;

  constructor(private readonly env: MultiAgentEnv, policies: ReadonlyMap<AgentId, AgentInterface>) {
    const ids = [...env.agentIds];
    if (!ids.length || ids.some(id => !id) || new Set(ids).size !== ids.length) {
      throw new Error('Multi-agent IDs must be nonempty and unique');
    }
    if (policies.size !== ids.length || ids.some(id => !policies.has(id))) {
      throw new Error('Provide exactly one policy for every environment agent');
    }
    if (new Set(policies.values()).size !== policies.size) {
      throw new Error('Shared policy instances are not supported');
    }
    this.policies = new Map(policies);
  }

  step(): Promise<MultiAgentStepResult> {
    return this.enqueue(() => this.transition(true));
  }

  inferStep(): Promise<MultiAgentStepResult> {
    return this.enqueue(() => this.transition(false));
  }

  reset(): Promise<void> {
    return this.enqueue(async () => {
      this.discardRollouts();
      this.env.reset();
      this.retired.clear();
    });
  }

  /** Automatic errors stop the loop and are available through lastError. */
  start(mode: 'train' | 'infer' = 'train', intervalMs = 50): void {
    if (mode !== 'train' && mode !== 'infer') throw new Error('Invalid multi-agent mode');
    if (!Number.isFinite(intervalMs) || intervalMs < 0) throw new Error('Invalid step interval');
    this.stop();
    this.lastError = null;
    const generation = this.generation;
    const tick = async () => {
      if (generation !== this.generation) return;
      try {
        await this.enqueue(async () => {
          if (generation !== this.generation) return;
          await this.transition(mode === 'train');
        });
      } catch (error: unknown) {
        if (generation !== this.generation) return;
        this.lastError = error instanceof Error ? error : new Error(String(error));
        this.stop();
        return;
      }
      if (generation === this.generation) this.timer = setTimeout(tick, intervalMs);
    };
    this.timer = setTimeout(tick, intervalMs);
  }

  /** An already-started transition may finish. Await reset/inferStep to establish a barrier. */
  stop(): void {
    this.generation++;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(operation);
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }

  private activeIds(): AgentId[] {
    const ids = [...this.env.activeAgentIds()];
    if (new Set(ids).size !== ids.length || ids.some(id => !this.policies.has(id))) {
      throw new Error('Active agent IDs must be unique registered IDs');
    }
    return ids.filter(id => !this.retired.has(id));
  }

  private observation(id: AgentId): number[] {
    const observation = this.env.observe(id);
    if (!Array.isArray(observation) || !observation.length || observation.some(value => !Number.isFinite(value))) {
      throw new Error(`Invalid observation for agent ${id}`);
    }
    return [...observation];
  }

  private discardRollouts(): void {
    for (const policy of this.policies.values()) policy.discardRollout?.();
  }

  private async transition(training: boolean): Promise<MultiAgentStepResult> {
    if (!training) this.discardRollouts();
    const ids = this.activeIds();
    if (!ids.length) throw new Error('No active agents; reset the environment before stepping');
    const states = new Map(ids.map(id => [id, this.observation(id)]));
    const decisions = await Promise.allSettled(ids.map(async id => {
      const action = await this.policies.get(id)!.getAction([...states.get(id)!], !training);
      const values = typeof action === 'number' ? [action] : action;
      if (!Array.isArray(values) || !values.length || values.some(value => !Number.isFinite(value))) {
        throw new Error(`Invalid action for agent ${id}`);
      }
      return [id, typeof action === 'number' ? action : [...action]] as const;
    }));
    const rejected = decisions.find(result => result.status === 'rejected');
    if (rejected?.status === 'rejected') throw rejected.reason;
    const actions = new Map(decisions.map(result => {
      if (result.status !== 'fulfilled') throw new Error('Unresolved policy decision');
      return result.value;
    }));
    this.env.step(new Map([...actions].map(([id, action]) => [id, typeof action === 'number' ? action : [...action]])));
    const globallyDone = this.env.done();
    const transitions = new Map<AgentId, Experience>();
    for (const id of ids) {
      const reward = this.env.reward(id);
      if (!Number.isFinite(reward)) throw new Error(`Invalid reward for agent ${id}`);
      const terminated = this.env.terminated(id);
      const truncated = this.env.truncated(id) || (globallyDone && !terminated);
      transitions.set(id, { state: states.get(id)!, action: actions.get(id)!, reward,
        nextState: this.observation(id), terminated, truncated });
    }
    for (const [id, experience] of transitions) {
      if (experience.terminated || experience.truncated) this.retired.add(id);
    }
    if (training) {
      for (const [id, experience] of transitions) {
        this.policies.get(id)!.remember({ ...experience, state: [...experience.state],
          nextState: [...experience.nextState], action: typeof experience.action === 'number' ? experience.action : [...experience.action] });
      }
      for (const id of ids) {
        const policy = this.policies.get(id)!;
        if (!policy.shouldTrain || policy.shouldTrain()) await policy.train();
      }
    }
    const episodeEnded = globallyDone || this.retired.size === this.policies.size;
    if (episodeEnded) { this.env.reset(); this.retired.clear(); }
    this.stepCount++;
    return { transitions, episodeEnded };
  }
}
