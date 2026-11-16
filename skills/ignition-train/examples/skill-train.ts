import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { GridWorldEnv } from '@ignitionai/environments';

/**
 * Declared before any training or evaluation in this module's runners.
 * Do not change these after a measured run has started.
 */
export const TRAIN_SEEDS = [11, 22, 33] as const;
export const TRAIN_EPISODES = 180;
export const TRAIN_MAX_STEPS = 80;
export const EVAL_EPISODES = 25;
export const EVAL_MAX_STEPS = 80;
export const GRID_SIZE = 5;
export const QTABLE_OVERRIDES = {
  stateBins: 5,
  lr: 0.3,
  gamma: 0.99,
  epsilon: 1,
  epsilonDecay: 0.99,
  minEpsilon: 0.05,
} as const;

export interface SeedReturns {
  seed: number;
  trainedMean: number;
  randomMean: number;
  trainedEpisodes: number[];
  randomEpisodes: number[];
}

export async function withSeed<T>(seed: number, fn: () => Promise<T> | T): Promise<T> {
  const previous = Math.random;
  let state = seed >>> 0;
  Math.random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  try {
    return await fn();
  } finally {
    Math.random = previous;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runEpisode(
  env: IgnitionEnvTFJS,
  greedy: boolean,
  maxSteps: number,
): Promise<number> {
  env.reset();
  let total = 0;
  for (let step = 0; step < maxSteps; step++) {
    const result = greedy ? await env.inferStep() : await env.step();
    total += result.reward;
    if (result.terminated || result.truncated) break;
  }
  return total;
}

async function randomPolicyReturns(episodes: number, maxSteps: number): Promise<number[]> {
  const world = new GridWorldEnv(GRID_SIZE);
  const returns: number[] = [];
  for (let ep = 0; ep < episodes; ep++) {
    world.reset();
    let total = 0;
    for (let step = 0; step < maxSteps; step++) {
      world.step(Math.floor(Math.random() * world.actions.length));
      total += world.reward();
      if (world.done()) break;
    }
    returns.push(total);
  }
  return returns;
}

async function trainThenEvaluate(seed: number): Promise<SeedReturns> {
  const world = new GridWorldEnv(GRID_SIZE);
  const env = new IgnitionEnvTFJS(world);
  env.train('qtable', { ...QTABLE_OVERRIDES });
  env.stop();

  const trainedEpisodes: number[] = [];
  for (let ep = 0; ep < TRAIN_EPISODES; ep++) {
    trainedEpisodes.push(await runEpisode(env, false, TRAIN_MAX_STEPS));
  }

  const evalTrained: number[] = [];
  for (let ep = 0; ep < EVAL_EPISODES; ep++) {
    evalTrained.push(await runEpisode(env, true, EVAL_MAX_STEPS));
  }

  const randomEpisodes = await randomPolicyReturns(EVAL_EPISODES, EVAL_MAX_STEPS);
  env.stop();
  env.agent?.dispose?.();

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    seed,
    trainedMean: mean(evalTrained),
    randomMean: mean(randomEpisodes),
    trainedEpisodes: evalTrained,
    randomEpisodes,
  };
}

export async function measureQTableVsRandom(): Promise<{
  seeds: typeof TRAIN_SEEDS;
  budget: {
    trainEpisodes: number;
    trainMaxSteps: number;
    evalEpisodes: number;
    evalMaxSteps: number;
    gridSize: number;
  };
  perSeed: SeedReturns[];
  trainedMean: number;
  randomMean: number;
}> {
  const perSeed: SeedReturns[] = [];
  for (const seed of TRAIN_SEEDS) {
    perSeed.push(await withSeed(seed, () => trainThenEvaluate(seed)));
  }
  const trainedMean = perSeed.reduce((a, r) => a + r.trainedMean, 0) / perSeed.length;
  const randomMean = perSeed.reduce((a, r) => a + r.randomMean, 0) / perSeed.length;
  return {
    seeds: TRAIN_SEEDS,
    budget: {
      trainEpisodes: TRAIN_EPISODES,
      trainMaxSteps: TRAIN_MAX_STEPS,
      evalEpisodes: EVAL_EPISODES,
      evalMaxSteps: EVAL_MAX_STEPS,
      gridSize: GRID_SIZE,
    },
    perSeed,
    trainedMean,
    randomMean,
  };
}

export async function assertNoStepsAfterStop(): Promise<{
  stepCountAtStop: number;
  stepCountAfterSettle: number;
  stepCountAfterWait: number;
}> {
  const env = new IgnitionEnvTFJS(new GridWorldEnv(GRID_SIZE));
  env.setSpeed(1);
  env.train('qtable', { ...QTABLE_OVERRIDES });

  const deadline = Date.now() + 2000;
  while (env.stepCount < 2 && Date.now() < deadline) {
    await sleep(10);
  }
  if (env.stepCount < 2) {
    throw new Error(`automatic loop did not step before stop(); lastError=${String(env.lastError)}`);
  }

  env.stop();
  const stepCountAtStop = env.stepCount;
  await sleep(20);
  const stepCountAfterSettle = env.stepCount;
  await sleep(200);
  const stepCountAfterWait = env.stepCount;
  env.agent?.dispose?.();
  return { stepCountAtStop, stepCountAfterSettle, stepCountAfterWait };
}
