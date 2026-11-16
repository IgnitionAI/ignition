import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';

/** Declared before any training call in this module. */
export const QUICKSTART_SEEDS = [11, 29, 47] as const;

/** Declared budget: 8 DQN transitions per seed on a small CPU network. */
export const QUICKSTART_BUDGET = {
  transitionsPerSeed: 8,
  hiddenLayers: [8] as const,
  batchSize: 4,
  memorySize: 64,
  backend: 'cpu' as const,
};

export interface QuickstartSnapshot {
  seed: number;
  stepCount: number;
  rewards: number[];
  observationSize: number;
  lastError: Error | null;
}

function createRunner(seed: number): IgnitionEnvTFJS {
  const runner = new IgnitionEnvTFJS(new CartPoleEnv());
  runner.train('dqn', {
    backend: QUICKSTART_BUDGET.backend,
    seed,
    hiddenLayers: [...QUICKSTART_BUDGET.hiddenLayers],
    batchSize: QUICKSTART_BUDGET.batchSize,
    memorySize: QUICKSTART_BUDGET.memorySize,
  });
  return runner;
}

function dispose(runner: IgnitionEnvTFJS): void {
  runner.stop();
  runner.agent?.dispose?.();
}

/**
 * Docs Quickstart plus a declared budget: `train('dqn')` then `stop()`,
 * then that many manual `step()` calls. Does not claim CartPole solved.
 */
export async function runQuickstartBudget(seed: number): Promise<QuickstartSnapshot> {
  const runner = createRunner(seed);
  runner.stop();
  const rewards: number[] = [];
  let observationSize = 0;
  for (let i = 0; i < QUICKSTART_BUDGET.transitionsPerSeed; i++) {
    const result = await runner.step();
    rewards.push(result.reward);
    observationSize = result.observation.length;
  }
  const snapshot: QuickstartSnapshot = {
    seed,
    stepCount: runner.stepCount,
    rewards,
    observationSize,
    lastError: runner.lastError,
  };
  dispose(runner);
  return snapshot;
}

/**
 * Start the automatic loop, wait for at least one tick, then `stop()`.
 * One in-flight transition may still finish (IgnitionEnv.stop()).
 */
export async function proveStopHaltsAutomaticLoop(seed: number): Promise<{
  afterStop: number;
  later: number;
  lastError: Error | null;
}> {
  const runner = createRunner(seed);
  const deadline = Date.now() + 5000;
  while (runner.stepCount < 1 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  runner.stop();
  const afterStop = runner.stepCount;
  await new Promise((resolve) => setTimeout(resolve, 200));
  const later = runner.stepCount;
  const lastError = runner.lastError;
  dispose(runner);
  return { afterStop, later, lastError };
}
