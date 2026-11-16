import type { StepResult, TrainingEnv } from '@ignitionai/core';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { MountainCarEnv } from '@ignitionai/environments';

/** Goal position used by `MountainCarEnv.done()` (`packages/environments/src/mountaincar.ts:7`). */
export const MOUNTAIN_CAR_GOAL_POS = 0.5;
/** Step limit mixed into `MountainCarEnv.done()` (`packages/environments/src/mountaincar.ts:8`). */
export const MOUNTAIN_CAR_MAX_STEPS = 200;
/** Observation / physics bounds (`packages/environments/src/mountaincar.ts:3-6`). */
export const MOUNTAIN_CAR_POS_LOW = -1.2;
export const MOUNTAIN_CAR_POS_HIGH = 0.6;
export const MOUNTAIN_CAR_VEL_LOW = -0.07;
export const MOUNTAIN_CAR_VEL_HIGH = 0.07;

/**
 * Budget and seeds declared before any comparison run.
 * True success = car position ≥ flag (`MOUNTAIN_CAR_GOAL_POS`), never the shaped return.
 */
export const MOUNTAIN_CAR_COMPARISON = {
  seeds: [7, 19, 31] as const,
  episodesPerSeed: 40,
  maxStepsPerEpisode: MOUNTAIN_CAR_MAX_STEPS,
  algorithm: 'qtable' as const,
  qtable: {
    stateBins: 18,
    stateLow: [MOUNTAIN_CAR_POS_LOW, MOUNTAIN_CAR_VEL_LOW],
    stateHigh: [MOUNTAIN_CAR_POS_HIGH, MOUNTAIN_CAR_VEL_HIGH],
    lr: 0.2,
    gamma: 0.99,
    epsilon: 1,
    epsilonDecay: 0.995,
    minEpsilon: 0.05,
  },
  shapingGamma: 0.99,
};

export type RewardPotential = (observation: number[]) => number;

export interface RewardShapingOptions {
  /** Φ(s). Default: first observation component (MountainCar position). */
  potential?: RewardPotential;
  /** Discount used in F(s,s') = γ Φ(s') − Φ(s). Default 0.99. */
  gamma?: number;
  /** Multiplier on the inner reward (sign + scale). Default 1. */
  scale?: number;
  /** Constant added every step (use a negative value as a time penalty). Default 0. */
  timePenalty?: number;
  /**
   * When true, Φ(s') is treated as 0 on `terminated()` transitions
   * (Ng, Harada, Russell 1999 absorbing-terminal convention). Default true.
   */
  zeroPotentialOnTerminate?: boolean;
  /** True terminal (goal / failure), distinct from a time limit. */
  terminated?: (env: TrainingEnv) => boolean;
  /** Time / step limit that is not a true terminal. */
  truncated?: (env: TrainingEnv) => boolean;
}

/**
 * Reward-shaping wrapper. Physics stay in `inner`; only `reward()` (and optional
 * terminal split) change. Potential-based term: F = γ Φ(s') − Φ(s).
 */
export class RewardShapingWrapper implements TrainingEnv {
  private prevObservation: number[];
  private shaping = 0;

  constructor(
    private readonly inner: TrainingEnv,
    private readonly options: RewardShapingOptions = {},
  ) {
    this.prevObservation = this.inner.observe();
  }

  get actions(): string[] | number {
    return this.inner.actions;
  }

  observe(): number[] {
    return this.inner.observe();
  }

  step(action: number | number[]): void {
    this.prevObservation = this.inner.observe();
    this.inner.step(action);
    const nextObservation = this.inner.observe();
    const phi = this.options.potential ?? defaultPotential;
    const gamma = this.options.gamma ?? 0.99;
    const nextPhi =
      (this.options.zeroPotentialOnTerminate ?? true) && this.terminated()
        ? 0
        : phi(nextObservation);
    this.shaping = gamma * nextPhi - phi(this.prevObservation);
  }

  reward(): number {
    const scale = this.options.scale ?? 1;
    const timePenalty = this.options.timePenalty ?? 0;
    return scale * this.inner.reward() + this.shaping + timePenalty;
  }

  done(): boolean {
    return this.terminated() || this.truncated() || this.inner.done();
  }

  terminated(): boolean {
    if (this.options.terminated) return this.options.terminated(this.unwrap());
    if (this.inner.terminated) return this.inner.terminated();
    return this.inner.done();
  }

  truncated(): boolean {
    if (this.options.truncated) return this.options.truncated(this.unwrap());
    if (this.inner.truncated) return this.inner.truncated();
    return false;
  }

  reset(): void {
    this.inner.reset();
    this.prevObservation = this.inner.observe();
    this.shaping = 0;
  }

  unwrap(): TrainingEnv {
    return unwrapEnv(this.inner);
  }

  innerEnv(): TrainingEnv {
    return this.inner;
  }
}

function defaultPotential(observation: number[]): number {
  return observation[0] ?? 0;
}

export function unwrapEnv(env: TrainingEnv): TrainingEnv {
  let current: TrainingEnv = env;
  while (current instanceof RewardShapingWrapper || current instanceof MountainCarTerminalWrapper) {
    current = current.innerEnv();
  }
  return current;
}

/**
 * Splits MountainCar's mixed `done()` into flag-reached vs step-limit.
 * Does not change `reward()`.
 */
export class MountainCarTerminalWrapper implements TrainingEnv {
  constructor(private readonly inner: MountainCarEnv) {}

  get actions(): string[] | number {
    return this.inner.actions;
  }

  observe(): number[] {
    return this.inner.observe();
  }

  step(action: number | number[]): void {
    this.inner.step(action);
  }

  reward(): number {
    return this.inner.reward();
  }

  done(): boolean {
    return this.terminated() || this.truncated();
  }

  terminated(): boolean {
    return mountainCarReachedFlag(this.inner);
  }

  truncated(): boolean {
    return this.inner.stepCount >= MOUNTAIN_CAR_MAX_STEPS && !this.terminated();
  }

  reset(): void {
    this.inner.reset();
  }

  innerEnv(): MountainCarEnv {
    return this.inner;
  }
}

export function mountainCarReachedFlag(env: TrainingEnv): boolean {
  const car = unwrapEnv(env);
  if (car instanceof MountainCarEnv) return car.position >= MOUNTAIN_CAR_GOAL_POS;
  const obs = env.observe();
  return (obs[0] ?? Number.NEGATIVE_INFINITY) >= MOUNTAIN_CAR_GOAL_POS;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Deterministic valley start matching MountainCar's [-0.6, -0.4] band. */
export function seedMountainCar(env: MountainCarEnv, seed: number, episodeIndex: number): void {
  const rng = mulberry32(seed + episodeIndex * 10007);
  env.position = -0.5 + rng() * 0.2 - 0.1;
  env.velocity = 0;
  env.stepCount = 0;
}

export class SeededMountainCar extends MountainCarTerminalWrapper {
  private episodeIndex = 0;

  constructor(
    private readonly seed: number,
    inner = new MountainCarEnv(),
  ) {
    super(inner);
    this.reset();
  }

  override reset(): void {
    super.reset();
    seedMountainCar(this.innerEnv(), this.seed, this.episodeIndex);
    this.episodeIndex += 1;
  }
}

export function wrapMountainCarReward(
  inner: TrainingEnv,
  shaped: boolean,
): TrainingEnv {
  if (!shaped) return inner;
  return new RewardShapingWrapper(inner, {
    gamma: MOUNTAIN_CAR_COMPARISON.shapingGamma,
    potential: (observation) => observation[0] ?? 0,
    timePenalty: 0,
    zeroPotentialOnTerminate: true,
    terminated: (env) => mountainCarReachedFlag(env),
    truncated: (env) => {
      const car = unwrapEnv(env);
      if (!(car instanceof MountainCarEnv)) return false;
      return car.stepCount >= MOUNTAIN_CAR_MAX_STEPS && !mountainCarReachedFlag(car);
    },
  });
}

export interface SeedComparisonRow {
  seed: number;
  variant: 'sparse' | 'shaped';
  episodes: number;
  flagSuccesses: number;
  timeouts: number;
  envSteps: number;
  sumReportedReward: number;
}

export interface MountainCarComparisonReport {
  declared: typeof MOUNTAIN_CAR_COMPARISON;
  rows: SeedComparisonRow[];
}

function formatDeclaration(): string {
  const c = MOUNTAIN_CAR_COMPARISON;
  return [
    '[skill-reward-shaping] Declared before running:',
    `  seeds=${JSON.stringify(c.seeds)}`,
    `  episodesPerSeed=${c.episodesPerSeed}`,
    `  maxStepsPerEpisode=${c.maxStepsPerEpisode}`,
    `  algorithm=${c.algorithm}`,
    `  qtable=${JSON.stringify(c.qtable)}`,
    `  shapingGamma=${c.shapingGamma}`,
    `  successCriterion=MountainCarEnv.position >= ${MOUNTAIN_CAR_GOAL_POS} (flag), not shaped reward`,
  ].join('\n');
}

/**
 * Compare sparse vs potential-shaped MountainCar. Callers must print
 * `formatDeclaration()` (or this function's leading log) before training.
 */
export async function compareMountainCarRewards(): Promise<MountainCarComparisonReport> {
  console.log(formatDeclaration());
  const rows: SeedComparisonRow[] = [];
  for (const seed of MOUNTAIN_CAR_COMPARISON.seeds) {
    rows.push(await runOneVariant(seed, false));
    rows.push(await runOneVariant(seed, true));
  }
  return { declared: MOUNTAIN_CAR_COMPARISON, rows };
}

async function runOneVariant(seed: number, shaped: boolean): Promise<SeedComparisonRow> {
  const inner = new SeededMountainCar(seed);
  const env = wrapMountainCarReward(inner, shaped);
  const runner = new IgnitionEnvTFJS(env);
  runner.train(MOUNTAIN_CAR_COMPARISON.algorithm, { ...MOUNTAIN_CAR_COMPARISON.qtable });
  runner.stop();

  let flagSuccesses = 0;
  let timeouts = 0;
  let envSteps = 0;
  let sumReportedReward = 0;

  for (let episode = 0; episode < MOUNTAIN_CAR_COMPARISON.episodesPerSeed; episode++) {
    let ended = false;
    for (let step = 0; step < MOUNTAIN_CAR_COMPARISON.maxStepsPerEpisode; step++) {
      const result: StepResult = await runner.step();
      envSteps += 1;
      sumReportedReward += result.reward;
      if (result.terminated) {
        flagSuccesses += 1;
        ended = true;
        break;
      }
      if (result.truncated) {
        timeouts += 1;
        ended = true;
        break;
      }
    }
    if (!ended) timeouts += 1;
  }

  runner.stop();
  runner.agent?.dispose?.();

  const row: SeedComparisonRow = {
    seed,
    variant: shaped ? 'shaped' : 'sparse',
    episodes: MOUNTAIN_CAR_COMPARISON.episodesPerSeed,
    flagSuccesses,
    timeouts,
    envSteps,
    sumReportedReward,
  };
  console.log('[skill-reward-shaping] result', JSON.stringify(row));
  return row;
}

export { formatDeclaration };
