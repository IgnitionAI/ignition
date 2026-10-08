export type TFBackend = 'webgpu' | 'webgl' | 'cpu' | 'wasm' | 'node' | 'auto';

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
  getAction(observation: number[], greedy?: boolean): Promise<number | number[]>;
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

// ─── Environment interfaces ─────────────────────────────────────────────────

/**
 * Contract for a training environment. The developer implements this
 * to describe their game/simulation for RL training.
 */
export interface TrainingEnv {
  /** Available actions: named list or count */
  actions: string[] | number;
  /** Return the current observation as a number array */
  observe(): number[];
  /** Apply an action to the environment */
  step(action: number | number[]): void;
  /** Return the reward for the current state */
  reward(): number;
  /** Return true if the episode is over */
  done(): boolean;
  /** Reset the environment for a new episode */
  reset(): void;
}

/**
 * Minimal contract for inference (production). No training, no rewards.
 */
export interface InferenceEnv {
  /** Return the current observation */
  observe(): number[];
  /** Apply an action */
  step(action: number | number[]): void;
}

// ─── Auto-configuration ─────────────────────────────────────────────────────

export type AlgorithmType = 'dqn' | 'ppo' | 'qtable';

/**
 * Factory function that creates an agent from a merged config.
 * Used by IgnitionEnv.train() to auto-create agents.
 */
export type AgentFactory = (config: Record<string, unknown>) => AgentInterface;
