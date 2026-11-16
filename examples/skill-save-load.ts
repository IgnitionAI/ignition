import './skill-save-load-polyfill';

import { DQNAgent, IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';
import { LocalStorageProvider } from '@ignitionai/storage';

/** Declared before any measurement run. Three seeds, no convergence claim. */
export const SAVE_LOAD_SEEDS = [7, 29, 101] as const;

/** Training steps per seed. Enough to fill a small replay batch and decay epsilon. */
export const SAVE_LOAD_STEP_BUDGET = 48;

/** Wall-clock budget for the executable example (CPU). */
export const SAVE_LOAD_CPU_BUDGET_MS = 60_000;

/** Observation used for greedy-action identity checks (not a live CartPole sample). */
export const GREEDY_PROBE = [0.1, 0, 0.05, 0] as const;

/**
 * LocalStorageProvider writes JSON metadata under this prefix
 * (`packages/storage/src/providers/localstorage.ts`). The prefix is not exported.
 */
export const LOCAL_STORAGE_META_PREFIX = 'ignition:meta:';

export function versionedCheckpoint(name: string, version: number): string {
  return `${name}-v${version}`;
}

export function stepCheckpoint(name: string, step: number): string {
  return `${name}-step-${step}`;
}

export function snapshotWeights(agent: DQNAgent): number[][] {
  return agent.getModel().getWeights().map((tensor) => Array.from(tensor.dataSync()));
}

export function maxAbsWeightDiff(left: number[][], right: number[][]): number {
  if (left.length !== right.length) {
    throw new Error(`Weight rank mismatch: ${left.length} vs ${right.length}`);
  }
  let max = 0;
  for (let i = 0; i < left.length; i++) {
    if (left[i].length !== right[i].length) {
      throw new Error(`Weight length mismatch at ${i}`);
    }
    for (let j = 0; j < left[i].length; j++) {
      const diff = Math.abs(left[i][j] - right[i][j]);
      if (diff > max) max = diff;
    }
  }
  return max;
}

export function readProviderMetadata(modelId: string): Record<string, unknown> {
  const raw = localStorage.getItem(`${LOCAL_STORAGE_META_PREFIX}${modelId}`);
  if (!raw) {
    throw new Error(`No LocalStorageProvider metadata for "${modelId}"`);
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

export interface SaveLoadRoundTrip {
  seed: number;
  modelId: string;
  uri: string;
  steps: number;
  greedyBefore: number;
  greedyAfter: number;
  weightMaxAbsDiff: number;
  epsilonBeforeSave: number;
  epsilonAfterLoadBeforeSetState: number;
  epsilonAfterSetState: number;
  trainStepCounterBeforeSave: number;
  trainStepCounterAfterSetState: number;
  envStepCountBeforeSave: number;
  envStepCountAfterLoad: number;
}

function dqnConfig(seed: number, storageProvider: LocalStorageProvider) {
  return {
    backend: 'cpu' as const,
    hiddenLayers: [8],
    batchSize: 8,
    memorySize: 64,
    epsilonDecay: 0.9,
    minEpsilon: 0.01,
    targetUpdateFrequency: 100,
    seed,
    storageProvider,
  };
}

/**
 * Train briefly, save through IgnitionEnv + LocalStorageProvider, reload into a
 * new runner, then restore agent state with setState (the load path does not).
 */
export async function roundTripLocalCheckpoint(seed: number): Promise<SaveLoadRoundTrip> {
  const storageProvider = new LocalStorageProvider();
  const modelId = versionedCheckpoint(`skill-save-load-seed-${seed}`, 1);
  const sourceEnv = new IgnitionEnvTFJS(new CartPoleEnv());
  sourceEnv.train('dqn', dqnConfig(seed, storageProvider));
  sourceEnv.stop();

  try {
    for (let i = 0; i < SAVE_LOAD_STEP_BUDGET; i++) {
      await sourceEnv.step();
    }
    if (!(sourceEnv.agent instanceof DQNAgent)) {
      throw new Error('Expected DQNAgent after train("dqn")');
    }
    const source = sourceEnv.agent;
    const stateBefore = source.getState();
    const weightsBefore = snapshotWeights(source);
    const greedyBefore = await source.getAction([...GREEDY_PROBE], true);
    const uri = await sourceEnv.save(modelId);

    const targetEnv = new IgnitionEnvTFJS(new CartPoleEnv());
    targetEnv.train('dqn', dqnConfig(seed, storageProvider));
    targetEnv.stop();
    try {
      if (!(targetEnv.agent instanceof DQNAgent)) {
        throw new Error('Expected DQNAgent on the reload runner');
      }
      await targetEnv.load(modelId);
      const loaded = targetEnv.agent;
      if (!(loaded instanceof DQNAgent)) {
        throw new Error('Expected DQNAgent after load()');
      }
      const epsilonAfterLoadBeforeSetState = loaded.getState().epsilon;
      if (typeof epsilonAfterLoadBeforeSetState !== 'number') {
        throw new Error('DQN getState() did not return epsilon');
      }
      const metadata = readProviderMetadata(modelId);
      loaded.setState(metadata);
      const greedyAfter = await loaded.getAction([...GREEDY_PROBE], true);
      const weightsAfter = snapshotWeights(loaded);
      const stateAfter = loaded.getState();
      if (typeof stateBefore.epsilon !== 'number' || typeof stateAfter.epsilon !== 'number') {
        throw new Error('epsilon missing from getState()');
      }
      if (
        typeof stateBefore.trainStepCounter !== 'number'
        || typeof stateAfter.trainStepCounter !== 'number'
      ) {
        throw new Error('trainStepCounter missing from getState()');
      }
      return {
        seed,
        modelId,
        uri: String(uri),
        steps: SAVE_LOAD_STEP_BUDGET,
        greedyBefore,
        greedyAfter,
        weightMaxAbsDiff: maxAbsWeightDiff(weightsBefore, weightsAfter),
        epsilonBeforeSave: stateBefore.epsilon,
        epsilonAfterLoadBeforeSetState,
        epsilonAfterSetState: stateAfter.epsilon,
        trainStepCounterBeforeSave: stateBefore.trainStepCounter,
        trainStepCounterAfterSetState: stateAfter.trainStepCounter,
        envStepCountBeforeSave: sourceEnv.stepCount,
        envStepCountAfterLoad: targetEnv.stepCount,
      };
    } finally {
      targetEnv.agent?.dispose?.();
      targetEnv.stop();
    }
  } finally {
    sourceEnv.agent?.dispose?.();
    sourceEnv.stop();
  }
}
