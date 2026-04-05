// ─── Observation & Action Spaces ────────────────────────────────────────────

export interface DiscreteSpace {
  type: 'discrete';
  /** Number of discrete actions/observations */
  n: number;
}

export interface BoxSpace {
  type: 'box';
  low: number[];
  high: number[];
  shape: number[];
}

export interface MultiDiscreteSpace {
  type: 'multidiscrete';
  /** Number of discrete values per dimension */
  nvec: number[];
}

export type ActionSpace = DiscreteSpace | BoxSpace | MultiDiscreteSpace;
export type ObservationSpace = DiscreteSpace | BoxSpace | MultiDiscreteSpace;

// ─── Experience (replay buffer entry) ───────────────────────────────────────

export interface Experience {
  state: number[];
  action: number | number[];
  reward: number;
  nextState: number[];
  /** True when the episode ended due to a terminal condition (agent failed, goal reached…) */
  terminated: boolean;
  /** True when the episode ended due to a time/step limit, not a terminal condition */
  truncated: boolean;
  info?: Record<string, unknown>;
}

// ─── Step result returned by IgnitionEnv.step() ─────────────────────────────

export interface StepResult {
  observation: number[];
  reward: number;
  terminated: boolean;
  truncated: boolean;
  info?: Record<string, unknown>;
}

// ─── Agent interfaces ────────────────────────────────────────────────────────

export interface AgentInterface {
  getAction(observation: number[]): Promise<number | number[]>;
  remember(experience: Experience): void;
  train(): Promise<void>;
  /** Release TF/GPU/WASM resources held by the agent */
  dispose?(): void;
  /** Reset agent internal state (epsilon, memory, counters…) */
  reset?(): void;
}

/**
 * Extends AgentInterface with checkpoint persistence.
 * Implement this on agents that support saving to external storage (e.g. HF Hub).
 */
export interface CheckpointableAgent extends AgentInterface {
  saveCheckpoint(repoId: string, token: string, checkpointName: string): Promise<void>;
}
