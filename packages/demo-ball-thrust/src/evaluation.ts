import { DQNAgent, IgnitionEnvTFJS, type DQNConfig } from '@ignitionai/backend-tfjs';
import type { AgentInterface } from '@ignitionai/core';
import { BallThrustEnv, type EpisodeSummary } from './ball-thrust-env';

/** Frozen before execution at c95c98f. No automatic experiment is started. */
export const TRAINING_PROTOCOL = Object.freeze({
  version: 1, seeds: Object.freeze([1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007]),
  budget: 4096, environmentSeed: 70, agentSeed: 68, randomSeed: 2026, horizon: 300, wallLimitMs: 300000,
});
export const DQN_CONFIG: DQNConfig = {
  inputSize: 21, actionSize: 9, hiddenLayers: [32, 32], batchSize: 32, memorySize: 8192,
  gamma: 0.99, lr: 0.001, epsilon: 1, minEpsilon: 0.05, epsilonDecay: 0.999,
  targetUpdateFrequency: 100, seed: 68, backend: 'cpu',
};
export interface EvaluationEpisode extends EpisodeSummary {}
export interface PolicyEvaluation {
  episodes: EvaluationEpisode[];
  meanReturn: number;
  successRate: number;
}
export interface EvaluationReport {
  initial: PolicyEvaluation;
  trained: PolicyEvaluation;
  random: PolicyEvaluation;
}

function checkDeadline(deadline: number): void {
  if (Date.now() >= deadline) throw new Error('Experiment wall-time budget exceeded; evaluation incomplete.');
}

async function evaluatePolicy(agent: AgentInterface, deadline: number): Promise<PolicyEvaluation> {
  const episodes: EvaluationEpisode[] = [];
  for (const seed of TRAINING_PROTOCOL.seeds) {
    const env = new BallThrustEnv(seed);
    try {
      const runner = new IgnitionEnvTFJS(env);
      runner.agent = agent;
      for (let step = 0; step < TRAINING_PROTOCOL.horizon; step++) {
        checkDeadline(deadline);
        const result = await runner.inferStep();
        checkDeadline(deadline);
        if (step % 32 === 31) await new Promise(resolve => setTimeout(resolve, 0));
        if (result.terminated || result.truncated) {
          if (!env.lastEpisode) throw new Error('Evaluation episode summary missing.');
          episodes.push({ ...env.lastEpisode });
          break;
        }
      }
    } finally { env.dispose(); }
  }
  return { episodes, meanReturn: episodes.reduce((sum, e) => sum + e.return, 0) / episodes.length,
    successRate: episodes.filter(e => e.outcome === 'success').length / episodes.length };
}

/** Independent worlds, greedy network actions, no fit/replay or visible-world mutation. */
export async function evaluatePolicies(trained: DQNAgent, deadline = Date.now() + TRAINING_PROTOCOL.wallLimitMs): Promise<EvaluationReport> {
  if (!Number.isFinite(deadline)) throw new RangeError('Evaluation deadline must be finite.');
  checkDeadline(deadline);
  const initial = new DQNAgent({ ...DQN_CONFIG });
  let randomState = TRAINING_PROTOCOL.randomSeed;
  const random: AgentInterface = {
    getAction: async () => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return Math.floor(randomState / 4294967296 * 9);
    }, remember: () => {}, train: async () => {}, reset: () => {},
  };
  try {
    return { initial: await evaluatePolicy(initial, deadline), trained: await evaluatePolicy(trained, deadline), random: await evaluatePolicy(random, deadline) };
  } finally { initial.dispose(); }
}
