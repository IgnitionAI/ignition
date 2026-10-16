import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import type { StepResult } from '@ignitionai/core';
import * as tf from '@tensorflow/tfjs';
import { RobotArmEnv, EpisodeStats, SUCCESS_DISTANCE } from './robot-arm-env';
import { DQN_PRESET } from './protocol';

export type ControllerMode = 'stopped' | 'training' | 'inference';

export interface EpisodeSummary extends EpisodeStats {
  episode: number;
}

export interface HudSnapshot {
  mode: ControllerMode;
  q0: number;
  q1: number;
  q2: number;
  tip: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  distance: number;
  successDistance: number;
  reward: number;
  blocked: number;
  transitions: number;
  updates: number;
  epsilon: number | null;
  episodes: number;
  lastEpisode: EpisodeSummary | null;
  history: EpisodeSummary[];
  recentRewards: number[];
  lastError: string | null;
}

const HISTORY_LIMIT = 50;
const RECENT_REWARDS_LIMIT = 120;

/**
 * Single serialized control loop for the robot-arm demo.
 * Every transition goes through IgnitionEnv.step()/inferStep(), which
 * serialize them on one tail promise. Pause/mode/reset wait for the
 * in-flight transition via the loop promise. One local loop only.
 */
export class RobotArmController {
  readonly arm: RobotArmEnv;
  private runner: IgnitionEnvTFJS;
  private agentSeed: number;
  private mode: ControllerMode = 'stopped';
  private loopPromise: Promise<void> | null = null;
  private cadenceMs = 50;
  private transitions = 0;
  private episodeCounter = 0;
  private history: EpisodeSummary[] = [];
  private recentRewards: number[] = [];
  private lastEpisode: EpisodeSummary | null = null;
  private listener: (() => void) | null = null;
  private disposed = false;
  private tfReady: Promise<void> | null = null;

  constructor(seed = 1, envSeed?: number) {
    this.arm = new RobotArmEnv(envSeed ?? seed);
    this.agentSeed = seed;
    // Record episode stats before IgnitionEnv auto-resets the env on done.
    const innerReset = this.arm.reset.bind(this.arm);
    this.arm.reset = () => {
      if (this.arm.currentStats.commands > 0 || this.arm.currentStats.success) {
        this.episodeCounter += 1;
        this.lastEpisode = { episode: this.episodeCounter, ...this.arm.currentStats };
        this.history = [...this.history.slice(-(HISTORY_LIMIT - 1)), this.lastEpisode];
      }
      innerReset();
      this.notify();
    };
    this.runner = new IgnitionEnvTFJS(this.arm);
  }

  onUpdate(listener: () => void): void {
    this.listener = listener;
  }

  private notify(): void {
    this.listener?.();
  }

  get modeState(): ControllerMode {
    return this.mode;
  }

  get updateCount(): number {
    const state = this.runner.agent?.getState?.();
    return typeof state?.trainStepCounter === 'number' ? state.trainStepCounter : 0;
  }

  get epsilon(): number | null {
    const state = this.runner.agent?.getState?.();
    return typeof state?.epsilon === 'number' ? state.epsilon : null;
  }

  /** The DQN online model, for weight variation proofs (null before creation). */
  getModel(): tf.LayersModel | null {
    const agent = this.runner.agent as { getModel?: () => tf.LayersModel } | null;
    return agent?.getModel?.() ?? null;
  }

  /** The underlying agent (greedy evaluation for the measurement protocol). */
  getAgent(): import('@ignitionai/core').AgentInterface | null {
    return this.runner.agent;
  }

  private ensureTfReady(): Promise<void> {
    this.tfReady ??= tf.ready().then(() => undefined);
    return this.tfReady;
  }

  /** Warm up the TF backend without creating an agent (stopped-at-load UX). */
  async initBackend(): Promise<void> {
    await this.ensureTfReady();
  }

  /** Create the DQN agent on first call (awaiting TF backend), then start training. */
  async train(): Promise<void> {
    if (this.disposed) throw new Error('[RobotArmController] disposed');
    await this.ensureTfReady();
    this.createAgentIfNeeded();
    this.setMode('training');
  }

  private createAgentIfNeeded(): void {
    if (!this.runner.agent) {
      this.runner.train('dqn', { ...DQN_PRESET, seed: this.agentSeed });
    } else {
      this.runner.train('dqn');
    }
    // The runner's internal automatic loop is never used: this controller
    // drives transitions manually through step()/inferStep(). stop() runs in
    // the same synchronous block, before the first tick can fire (50 ms).
    this.runner.stop();
  }

  /**
   * Headless/tests/measurement: agent created, every loop stopped, no
   * transition in flight — the caller drives stepOnce()/inferOnce() manually.
   */
  async prepare(): Promise<void> {
    if (this.disposed) throw new Error('[RobotArmController] disposed');
    await this.ensureTfReady();
    this.createAgentIfNeeded();
    await this.settle();
  }

  /** Greedy inference — requires at least one effective weight update. */
  infer(): void {
    if (this.updateCount < 1) return;
    this.setMode('inference');
  }

  pause(): void {
    this.setMode('stopped');
  }

  /** Waits for the in-flight transition (if any), then stops scheduling. */
  private async settle(): Promise<void> {
    this.mode = 'stopped'; // set before awaiting: the loop can then exit
    this.runner.stop();
    const pending = this.loopPromise;
    if (pending) await pending.catch(() => undefined);
  }

  /** New episode, new target (env RNG); keeps the network and counters. Serialized. */
  async newEpisode(): Promise<void> {
    await this.settle();
    // runner.reset keeps the runner's internal currentState in sync.
    this.runner.reset();
    this.notify();
  }

  /** Destroy the network and all training state; the next train() recreates it. */
  async restartLearning(): Promise<void> {
    await this.settle();
    const previous = this.runner.agent;
    this.runner.agent = null;
    if (previous) {
      try {
        previous.dispose?.();
      } catch {
        // disposal best-effort; a new agent is created on next train()
      }
    }
    this.transitions = 0;
    this.episodeCounter = 0;
    this.history = [];
    this.recentRewards = [];
    this.lastEpisode = null;
    this.runner.reset();
    this.notify();
  }

  /** Command cadence: 1x = one command every 50 ms. */
  setSpeed(multiplier: number): void {
    this.cadenceMs = Math.max(0, Math.round(50 / Math.max(1, multiplier)));
  }

  /** One serialized training step. Used by the UI loop and the measurement. */
  async stepOnce(): Promise<StepResult> {
    const result = await this.runner.step();
    this.afterStep(result.reward);
    return result;
  }

  /** One serialized greedy step (inference mode). */
  async inferOnce(): Promise<StepResult> {
    const result = await this.runner.inferStep();
    this.afterStep(result.reward);
    return result;
  }

  private afterStep(reward: number): void {
    this.transitions += 1;
    this.recentRewards = [...this.recentRewards.slice(-(RECENT_REWARDS_LIMIT - 1)), reward];
    this.notify();
  }

  private setMode(mode: ControllerMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.ensureLoop();
    this.notify();
  }

  /** Starts the single local loop if needed; the loop re-arms itself after gaps. */
  private ensureLoop(): void {
    if (this.loopPromise !== null || this.mode === 'stopped' || this.disposed) return;
    this.loopPromise = (async () => {
      try {
        while (this.mode !== 'stopped' && !this.disposed) {
          const start = Date.now();
          if (this.mode === 'training') await this.stepOnce();
          else await this.inferOnce();
          const wait = this.cadenceMs - (Date.now() - start);
          // cadence governs the command rate; always yield to the browser
          await new Promise((resolve) => setTimeout(resolve, Math.max(0, wait)));
        }
      } finally {
        this.loopPromise = null;
        this.ensureLoop();
        this.notify();
      }
    })();
  }

  snapshot(): HudSnapshot {
    const target = this.arm.targetPosition;
    const tip = { x: this.arm.tip.x, y: this.arm.tip.y, z: this.arm.tip.z };
    const dist = Math.hypot(target.x - tip.x, target.y - tip.y, target.z - tip.z);
    return {
      mode: this.mode,
      q0: this.arm.angles.q0,
      q1: this.arm.angles.q1,
      q2: this.arm.angles.q2,
      tip,
      target,
      distance: dist,
      successDistance: SUCCESS_DISTANCE,
      reward: this.arm.reward(),
      blocked: this.arm.blockedLastCommand,
      transitions: this.transitions,
      updates: this.updateCount,
      epsilon: this.epsilon,
      episodes: this.episodeCounter,
      lastEpisode: this.lastEpisode,
      history: [...this.history],
      recentRewards: [...this.recentRewards],
      lastError: this.runner.lastError?.message ?? null,
    };
  }

  dispose(): void {
    this.disposed = true;
    this.mode = 'stopped';
    this.runner.stop();
    this.runner.agent?.dispose?.();
    this.runner.agent = null;
    this.listener = null;
  }
}

/** Flat weight snapshot (every weight), for train/invariance proofs. */
export function snapshotWeights(model: tf.LayersModel): number[] {
  const out: number[] = [];
  for (const w of model.getWeights()) out.push(...w.dataSync());
  return out;
}

/** Sum of absolute per-weight variation between two snapshots. */
export function weightsDelta(before: number[], after: number[]): number {
  let delta = 0;
  for (let i = 0; i < after.length; i++) delta += Math.abs(after[i] - before[i]);
  return delta;
}
