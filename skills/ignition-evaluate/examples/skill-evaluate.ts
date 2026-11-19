import type { AgentInterface, TrainingEnv } from '@ignitionai/core';
import { CartPoleEnv } from '@ignitionai/environments';
import type { DQNAgent } from '@ignitionai/backend-tfjs';

/**
 * Declared before any evaluation run.
 * Train seeds are listed only to keep them disjoint from eval seeds.
 * This example does not train to a target return and does not claim convergence.
 */
export const TRAIN_SEEDS = [11, 29, 47] as const;
export const EVAL_SEEDS = [101, 202, 303] as const;
export const EPISODES_PER_SEED = 3;
export const MAX_STEPS_PER_EPISODE = 500;
export const RANDOM_BASELINE_SEED = 9001;
export const POLICY_AGENT_SEED = 11;

export const EVAL_BUDGET = {
  policy: 'frozen-greedy-dqn',
  trainSeedsHeldOutFromEval: TRAIN_SEEDS,
  evalSeeds: EVAL_SEEDS,
  episodesPerSeed: EPISODES_PER_SEED,
  maxStepsPerEpisode: MAX_STEPS_PER_EPISODE,
  maxEnvStepsPolicy:
    EVAL_SEEDS.length * EPISODES_PER_SEED * MAX_STEPS_PER_EPISODE,
  maxEnvStepsRandomBaseline:
    EVAL_SEEDS.length * EPISODES_PER_SEED * MAX_STEPS_PER_EPISODE,
  notes:
    'Greedy getAction only. No remember/train during evaluate(). Random baseline uses the same env seeds.',
} as const;

export type EnvFactory = (seed: number) => TrainingEnv;

export interface ReturnStats {
  n: number;
  mean: number;
  sampleStd: number;
  stderr: number;
  ci95Low: number;
  ci95High: number;
}

export interface EvaluationReport {
  policy: string;
  seeds: number[];
  episodesPerSeed: number;
  returns: number[];
  stats: ReturnStats;
  budget: typeof EVAL_BUDGET;
  randomBaseline?: ReturnStats;
  meanMinusRandom?: number;
}

const Z95 = 1.96;

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function episodeSeed(evalSeed: number, episodeIndex: number): number {
  const mixed = (Math.imul(evalSeed, 1009) + Math.imul(episodeIndex + 1, 9176) + 13) >>> 0;
  return mixed === 0 ? 1 : mixed;
}

/** CartPoleEnv has no seed API; map a seed onto the public `state` field. */
export function applySeededCartPoleState(env: CartPoleEnv, seed: number): void {
  const rng = createRng(seed);
  env.state = {
    x: (rng() - 0.5) * 0.1,
    xDot: (rng() - 0.5) * 0.1,
    theta: (rng() - 0.5) * 0.1,
    thetaDot: (rng() - 0.5) * 0.1,
    stepCount: 0,
  };
}

export function seededCartPoleFactory(seed: number): CartPoleEnv {
  const env = new CartPoleEnv();
  applySeededCartPoleState(env, seed);
  return env;
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error('mean() requires at least one value');
  }
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

export function sampleStd(values: readonly number[]): number {
  if (values.length < 2) {
    throw new Error('sampleStd() requires at least two values');
  }
  const m = mean(values);
  let sumSq = 0;
  for (const value of values) {
    const d = value - m;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / (values.length - 1));
}

export function summarizeReturns(returns: readonly number[]): ReturnStats {
  const n = returns.length;
  const m = mean(returns);
  const s = sampleStd(returns);
  const stderr = s / Math.sqrt(n);
  return {
    n,
    mean: m,
    sampleStd: s,
    stderr,
    ci95Low: m - Z95 * stderr,
    ci95High: m + Z95 * stderr,
  };
}

export function snapshotDqnWeights(agent: DQNAgent): number[] {
  const out: number[] = [];
  for (const tensor of agent.getModel().getWeights()) {
    out.push(...Array.from(tensor.dataSync()));
  }
  return out;
}

function discreteAction(action: number | number[]): number {
  return typeof action === 'number' ? action : action[0];
}

async function runGreedyEpisode(
  agent: AgentInterface,
  env: TrainingEnv,
): Promise<number> {
  let episodeReturn = 0;
  let steps = 0;
  while (!env.done() && steps < MAX_STEPS_PER_EPISODE) {
    const action = discreteAction(await agent.getAction(env.observe(), true));
    env.step(action);
    episodeReturn += env.reward();
    steps += 1;
  }
  return episodeReturn;
}

function runRandomEpisode(env: TrainingEnv, rng: () => number, actionCount: number): number {
  let episodeReturn = 0;
  let steps = 0;
  while (!env.done() && steps < MAX_STEPS_PER_EPISODE) {
    env.step(Math.floor(rng() * actionCount));
    episodeReturn += env.reward();
    steps += 1;
  }
  return episodeReturn;
}

function actionCountOf(env: TrainingEnv): number {
  return typeof env.actions === 'number' ? env.actions : env.actions.length;
}

export async function evaluate(
  agent: AgentInterface,
  envFactory: EnvFactory,
  seeds: readonly number[],
  episodes: number,
): Promise<EvaluationReport> {
  if (seeds.length < 1) throw new Error('evaluate() requires at least one eval seed');
  if (episodes < 1) throw new Error('evaluate() requires at least one episode per seed');

  const returns: number[] = [];
  for (const seed of seeds) {
    for (let episode = 0; episode < episodes; episode += 1) {
      const env = envFactory(episodeSeed(seed, episode));
      returns.push(await runGreedyEpisode(agent, env));
    }
  }

  return {
    policy: 'greedy-frozen',
    seeds: [...seeds],
    episodesPerSeed: episodes,
    returns,
    stats: summarizeReturns(returns),
    budget: EVAL_BUDGET,
  };
}

export async function evaluateRandomBaseline(
  envFactory: EnvFactory,
  seeds: readonly number[],
  episodes: number,
  rngSeed: number = RANDOM_BASELINE_SEED,
): Promise<ReturnStats> {
  const rng = createRng(rngSeed);
  const returns: number[] = [];
  for (const seed of seeds) {
    for (let episode = 0; episode < episodes; episode += 1) {
      const env = envFactory(episodeSeed(seed, episode));
      returns.push(runRandomEpisode(env, rng, actionCountOf(env)));
    }
  }
  return summarizeReturns(returns);
}

export async function evaluateWithRandomBaseline(
  agent: AgentInterface,
  envFactory: EnvFactory,
  seeds: readonly number[],
  episodes: number,
): Promise<EvaluationReport> {
  const report = await evaluate(agent, envFactory, seeds, episodes);
  const randomBaseline = await evaluateRandomBaseline(envFactory, seeds, episodes);
  return {
    ...report,
    randomBaseline,
    meanMinusRandom: report.stats.mean - randomBaseline.mean,
  };
}

export function formatEvaluationReport(report: EvaluationReport): string {
  const lines = [
    '# Policy evaluation report',
    '',
    `- Policy: ${report.policy} (greedy getAction; no learning during eval)`,
    `- Train seeds (not used for eval): ${TRAIN_SEEDS.join(', ')}`,
    `- Eval seeds: ${report.seeds.join(', ')}`,
    `- Episodes per seed: ${report.episodesPerSeed}`,
    `- Episode returns: ${report.returns.join(', ')}`,
    `- Mean return: ${report.stats.mean.toFixed(4)} ± ${report.stats.sampleStd.toFixed(4)} (sample std, n=${report.stats.n})`,
    `- 95% CI: [${report.stats.ci95Low.toFixed(4)}, ${report.stats.ci95High.toFixed(4)}]`,
    `- Budget: max ${report.budget.maxEnvStepsPolicy} env steps for the policy, same cap for the random baseline`,
  ];
  if (report.randomBaseline && report.meanMinusRandom !== undefined) {
    lines.push(
      `- Random baseline mean: ${report.randomBaseline.mean.toFixed(4)} ± ${report.randomBaseline.sampleStd.toFixed(4)}`,
      `- Policy mean minus random mean: ${report.meanMinusRandom.toFixed(4)}`,
    );
  }
  lines.push('', 'No convergence is claimed. Numbers are the measured returns for this budget and these seeds.');
  return lines.join('\n');
}
