/**
 * DQN vs Double DQN on the discrete Target Chasing task (nav1d, same task as RL 1).
 *
 * Pure training core shared by the train script and the tests. The agent class is
 * injected so tests can use the TypeScript sources and the scripts can use dist/.
 *
 * Budget rule: both algorithms get exactly `budget.envStepsPerRun` environment steps,
 * the same network, the same hyperparameters and the same seeds. The only config key
 * that differs between the two algorithms is `doubleQ`.
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as tf from '@tensorflow/tfjs';
import { mean, mulberry32, nav1dStep } from './nav1d.mjs';

export const ALGOS = ['dqn', 'double-dqn'];

/** Agent config for one run. The only algo-dependent key is doubleQ. */
export function buildAgentConfig(experiment, algo, seed) {
  if (!ALGOS.includes(algo)) throw new Error(`unknown algo: ${algo}`);
  const a = experiment.agent;
  return {
    inputSize: a.inputSize,
    actionSize: a.actionSize,
    hiddenLayers: [...a.hiddenLayers],
    lr: a.lr,
    gamma: a.gamma,
    epsilon: a.epsilon,
    epsilonDecay: a.epsilonDecay,
    minEpsilon: a.minEpsilon,
    batchSize: a.batchSize,
    memorySize: a.memorySize,
    targetUpdateFrequency: a.targetUpdateFrequency,
    backend: a.backend,
    seed,
    doubleQ: algo === 'double-dqn',
  };
}

/** Fixed probe start states, identical for every algo, seed and checkpoint. */
export function probeStates(experiment) {
  const { count, min, max } = experiment.overestimation.probeStarts;
  if (count === 1) return [min];
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));
}

/** Discounted return of the optimal policy (always +0.15) from `pos`. */
export function optimalDiscountedReturn(pos, gamma, maxSteps) {
  let total = 0;
  let discount = 1;
  for (let step = 0; step < maxSteps; step++) {
    const { newPos, reward, done } = nav1dStep(pos, 1);
    total += discount * reward;
    discount *= gamma;
    pos = newPos;
    if (done) break;
  }
  return total;
}

function qValuesOf(model, states) {
  return tf.tidy(() => (model.predict(tf.tensor2d(states.map((s) => [s]))) ).arraySync());
}

/**
 * For each probe start: max_a Q(s0, a) from the online network, and the observed
 * discounted Monte-Carlo return of the greedy policy from s0 (deterministic env,
 * so one rollout is the exact return of that policy). Same gamma as training.
 */
export async function measureQVsReturn(agent, experiment, starts) {
  const { gamma } = experiment.agent;
  const maxSteps = experiment.budget.maxStepsPerEpisode;
  const q = qValuesOf(agent.getModel(), starts);
  const probes = [];
  for (let i = 0; i < starts.length; i++) {
    let pos = starts[i];
    let ret = 0;
    let undiscounted = 0;
    let discount = 1;
    let steps = 0;
    let success = false;
    for (let step = 0; step < maxSteps; step++) {
      const action = await agent.getAction([pos], true);
      const { newPos, reward, done } = nav1dStep(pos, action);
      ret += discount * reward;
      undiscounted += reward;
      discount *= gamma;
      steps += 1;
      pos = newPos;
      if (done) { success = true; break; }
    }
    const qMax = Math.max(...q[i]);
    probes.push({
      start: starts[i],
      q: q[i],
      qMax,
      discountedReturn: ret,
      undiscountedReturn: undiscounted,
      optimalDiscountedReturn: optimalDiscountedReturn(starts[i], gamma, maxSteps),
      gap: qMax - ret,
      steps,
      success,
    });
  }
  return {
    meanQMax: mean(probes.map((p) => p.qMax)),
    meanDiscountedReturn: mean(probes.map((p) => p.discountedReturn)),
    meanOptimalDiscountedReturn: mean(probes.map((p) => p.optimalDiscountedReturn)),
    meanGap: mean(probes.map((p) => p.gap)),
    successRate: probes.filter((p) => p.success).length / probes.length,
    probes,
  };
}

/** Greedy replay from one start (ε = 0), the side-by-side replay of the page. */
export async function greedyEpisodeFrom(agent, experiment, startPos) {
  let pos = startPos;
  let total = 0;
  const actions = [];
  const positions = [pos];
  let success = false;
  for (let step = 0; step < experiment.budget.maxStepsPerEpisode; step++) {
    const action = await agent.getAction([pos], true);
    actions.push(action);
    const { newPos, reward, done } = nav1dStep(pos, action);
    total += reward;
    pos = newPos;
    positions.push(pos);
    if (done) { success = true; break; }
  }
  return { episodeReturn: total, steps: actions.length, success, actions, positions };
}

/** Greedy episodes from the RL 1 eval start distribution (rng seed * 17 + 3). */
export async function evaluateGreedy(agent, experiment, seed) {
  const envRng = mulberry32(seed * 17 + 3);
  const rows = [];
  for (let ep = 0; ep < experiment.eval.greedyEpisodes; ep++) {
    let pos = envRng() * 0.4;
    let total = 0;
    let steps = 0;
    let success = false;
    for (let step = 0; step < experiment.budget.maxStepsPerEpisode; step++) {
      const action = await agent.getAction([pos], true);
      const { newPos, reward, done } = nav1dStep(pos, action);
      total += reward;
      steps += 1;
      pos = newPos;
      if (done) { success = true; break; }
    }
    rows.push({ return: total, steps, success });
  }
  return {
    greedyEvalMean: mean(rows.map((r) => r.return)),
    greedySuccessRate: rows.filter((r) => r.success).length / rows.length,
    greedyEvalReturns: rows.map((r) => r.return),
  };
}

/**
 * One training run. Writes, when `outDir` is given:
 *   episodes.jsonl, q-vs-return.jsonl, summary.json, untrained-greedy.json, trained-greedy.json,
 *   untrained/ and trained/ (tfjs LayersModel via `provider`).
 * Returns { summary, episodes, qVsReturn } in memory as well.
 */
export async function runTraining({ AgentClass, experiment, algo, seed, outDir, provider, envSteps, log }) {
  const budgetSteps = envSteps ?? experiment.budget.envStepsPerRun;
  const evalEvery = experiment.overestimation.everyEnvSteps;
  const learningStarts = experiment.budget.learningStarts;
  const maxSteps = experiment.budget.maxStepsPerEpisode;
  const lastN = experiment.summary.lastEpisodes;
  const starts = probeStates(experiment);

  const config = buildAgentConfig(experiment, algo, seed);
  if (provider) config.storageProvider = provider;
  const agent = new AgentClass(config);

  let episodesPath;
  let qPath;
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    episodesPath = join(outDir, 'episodes.jsonl');
    qPath = join(outDir, 'q-vs-return.jsonl');
    writeFileSync(episodesPath, '');
    writeFileSync(qPath, '');
  }
  const episodes = [];
  const qVsReturn = [];
  const recordQ = async (globalStep) => {
    const m = await measureQVsReturn(agent, experiment, starts);
    const row = { algo, seed, step: globalStep, globalStep, epsilon: agent.getState().epsilon, ...m };
    qVsReturn.push(row);
    if (qPath) appendFileSync(qPath, `${JSON.stringify(row)}\n`);
    return row;
  };

  try {
    if (provider) {
      await agent.save('untrained');
      const q = qValuesOf(agent.getModel(), [0.2])[0];
      const replay = await greedyEpisodeFrom(agent, experiment, 0.2);
      const untrainedProbe = { state: [0.2], action: await agent.getAction([0.2], true), q, ...replay };
      if (outDir) writeFileSync(join(outDir, 'untrained-greedy.json'), JSON.stringify(untrainedProbe, null, 2));
    }
    const untrainedEval = await evaluateGreedy(agent, experiment, seed);
    await recordQ(0);

    const envRng = mulberry32(seed * 1009);
    let globalStep = 0;
    let episode = 0;
    let trainSteps = 0;
    let partialEpisode = null;
    while (globalStep < budgetSteps) {
      let pos = envRng() * 0.4;
      let total = 0;
      let steps = 0;
      let terminated = false;
      let cutByBudget = false;
      for (let step = 0; step < maxSteps; step++) {
        const state = [pos];
        const action = await agent.getAction(state);
        const { newPos, reward, done } = nav1dStep(pos, action);
        agent.remember({
          state,
          action,
          reward,
          nextState: [newPos],
          terminated: done,
          truncated: !done && step === maxSteps - 1,
        });
        globalStep += 1;
        if (globalStep > learningStarts) {
          await agent.train();
          trainSteps += 1;
        }
        total += reward;
        steps += 1;
        pos = newPos;
        terminated = done;
        if (globalStep % evalEvery === 0) await recordQ(globalStep);
        if (done) break;
        if (globalStep >= budgetSteps) { cutByBudget = true; break; }
      }
      if (cutByBudget) {
        partialEpisode = { steps, return: total };
        break;
      }
      episode += 1;
      const row = {
        algo,
        seed,
        episode,
        return: total,
        steps,
        terminated,
        success: terminated,
        globalStep,
        epsilon: agent.getState().epsilon,
      };
      episodes.push(row);
      if (episodesPath) appendFileSync(episodesPath, `${JSON.stringify(row)}\n`);
      if (log && episode % 200 === 0) log({ algo, seed, episode, globalStep, epsilon: row.epsilon });
    }
    if (globalStep % evalEvery !== 0) await recordQ(globalStep);

    let trainedProbe = null;
    if (provider) {
      await agent.save('trained');
      const q = qValuesOf(agent.getModel(), [0.2])[0];
      const replay = await greedyEpisodeFrom(agent, experiment, 0.2);
      trainedProbe = { state: [0.2], action: await agent.getAction([0.2], true), q, ...replay };
    }
    const trainedEval = await evaluateGreedy(agent, experiment, seed);
    const lastRows = episodes.slice(-lastN);
    const finalQ = qVsReturn[qVsReturn.length - 1];
    const summary = {
      algo,
      seed,
      doubleQ: config.doubleQ,
      envSteps: globalStep,
      trainSteps,
      targetUpdates: Math.floor(trainSteps / config.targetUpdateFrequency),
      episodes: episodes.length,
      partialEpisodeAtBudget: partialEpisode,
      finalEpsilon: agent.getState().epsilon,
      lastEpisodesCount: lastRows.length,
      lastMeanReturn: mean(lastRows.map((r) => r.return)),
      lastSuccessRate: lastRows.length ? lastRows.filter((r) => r.success).length / lastRows.length : null,
      allEpisodesSuccessRate: episodes.length ? episodes.filter((r) => r.success).length / episodes.length : null,
      untrainedGreedyEvalMean: untrainedEval.greedyEvalMean,
      untrainedGreedySuccessRate: untrainedEval.greedySuccessRate,
      greedyEvalMean: trainedEval.greedyEvalMean,
      greedySuccessRate: trainedEval.greedySuccessRate,
      greedyEvalReturns: trainedEval.greedyEvalReturns,
      finalQVsReturn: {
        globalStep: finalQ.globalStep,
        meanQMax: finalQ.meanQMax,
        meanDiscountedReturn: finalQ.meanDiscountedReturn,
        meanOptimalDiscountedReturn: finalQ.meanOptimalDiscountedReturn,
        meanGap: finalQ.meanGap,
        successRate: finalQ.successRate,
      },
      meanGapOverRun: mean(qVsReturn.map((r) => r.meanGap)),
      meanGapSecondHalf: mean(qVsReturn.filter((r) => r.globalStep > globalStep / 2).map((r) => r.meanGap)),
    };
    if (outDir) {
      writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
      if (trainedProbe) writeFileSync(join(outDir, 'trained-greedy.json'), JSON.stringify(trainedProbe, null, 2));
    }
    return { summary, episodes, qVsReturn, trainedProbe };
  } finally {
    agent.dispose();
  }
}
