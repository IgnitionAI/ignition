import type { ModelStorageProvider } from '@ignitionai/storage';
import { IgnitionEnvTFJS, DQNAgent } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';
import * as tf from '../packages/backend-tfjs/node_modules/@tensorflow/tfjs';

type LayersModel = tf.LayersModel;
type ModelArtifacts = tf.io.ModelArtifacts;

/**
 * Declared before any training or inference run.
 * Seeds and step counts are a compute budget, not a claim that CartPole solves.
 */
export const TRAIN_INFER_SPLIT_BUDGET = {
  seeds: [11, 23, 47] as const,
  trainSteps: 8,
  inferSteps: 16,
  hiddenLayers: [8] as const,
  batchSize: 4,
  memorySize: 32,
  greedyObservations: [
    [0, 0, 0, 0],
    [0.1, 0, 0.02, 0],
    [-0.1, 0, -0.02, 0],
    [0.2, 0.1, 0.05, 0.01],
    [-0.2, -0.1, -0.05, -0.01],
  ],
  maxCpuMs: 60_000,
} as const;

export interface TrainInferSplitReport {
  seed: number;
  trainSteps: number;
  inferSteps: number;
  weightsUnchangedAfterInfer: boolean;
  greedyActionsMatchAfterReload: boolean;
  greedyBefore: number[];
  greedyAfter: number[];
  tensorsBeforeDispose: number;
  tensorsAfterDispose: number;
}

export function createInMemoryModelStore(): ModelStorageProvider {
  const artifacts = new Map<string, ModelArtifacts>();
  return {
    async save(modelId, model) {
      await model.save(
        tf.io.withSaveHandler(async (saved) => {
          artifacts.set(modelId, saved);
          return { modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(saved) };
        }),
      );
      return `memory://${modelId}`;
    },
    async load(modelId) {
      const saved = artifacts.get(modelId);
      if (!saved) {
        throw new Error(`No saved model: ${modelId}`);
      }
      return tf.loadLayersModel(tf.io.fromMemory(saved));
    },
    async list() {
      return [...artifacts.keys()].map((modelId) => ({ modelId, uri: `memory://${modelId}` }));
    },
    async delete(modelId) {
      artifacts.delete(modelId);
    },
    async exists(modelId) {
      return artifacts.has(modelId);
    },
  };
}

function asDqn(agent: unknown): DQNAgent {
  if (!(agent instanceof DQNAgent)) {
    throw new Error('Expected a DQNAgent created by IgnitionEnvTFJS.train("dqn")');
  }
  return agent;
}

function weightSnapshot(model: LayersModel): number[][] {
  return model.getWeights().map((tensor) => Array.from(tensor.dataSync()));
}

function dqnOverrides(seed: number, storageProvider: ModelStorageProvider) {
  return {
    backend: 'cpu' as const,
    hiddenLayers: [...TRAIN_INFER_SPLIT_BUDGET.hiddenLayers],
    batchSize: TRAIN_INFER_SPLIT_BUDGET.batchSize,
    memorySize: TRAIN_INFER_SPLIT_BUDGET.memorySize,
    seed,
    storageProvider,
  };
}

/**
 * Headless train → artefact → new-instance greedy inference, for one seed.
 * Does not score episode returns and does not claim convergence.
 */
export async function runTrainInferSplit(seed: number): Promise<TrainInferSplitReport> {
  await tf.setBackend('cpu');
  const storageProvider = createInMemoryModelStore();
  const trainWorld = new CartPoleEnv();
  const trainer = new IgnitionEnvTFJS(trainWorld);
  trainer.train('dqn', dqnOverrides(seed, storageProvider));
  trainer.stop();

  for (let i = 0; i < TRAIN_INFER_SPLIT_BUDGET.trainSteps; i++) {
    await trainer.step();
  }

  const trained = asDqn(trainer.agent);
  const weightsBeforeInfer = weightSnapshot(trained.getModel());
  for (let i = 0; i < TRAIN_INFER_SPLIT_BUDGET.inferSteps; i++) {
    await trainer.inferStep();
  }
  const weightsAfterInfer = weightSnapshot(trained.getModel());
  const greedyBefore = await Promise.all(
    TRAIN_INFER_SPLIT_BUDGET.greedyObservations.map((observation) =>
      trained.getAction([...observation], true),
    ),
  );

  await trainer.save('skill-train-infer-split');
  const tensorsBeforeDispose = tf.memory().numTensors;
  trainer.stop();
  trained.dispose();
  const tensorsAfterDispose = tf.memory().numTensors;

  const inferWorld = new CartPoleEnv();
  const inference = new IgnitionEnvTFJS(inferWorld);
  inference.train('dqn', dqnOverrides(seed, storageProvider));
  inference.stop();
  await inference.load('skill-train-infer-split');
  const reloaded = asDqn(inference.agent);
  const greedyAfter = await Promise.all(
    TRAIN_INFER_SPLIT_BUDGET.greedyObservations.map((observation) =>
      reloaded.getAction([...observation], true),
    ),
  );
  inference.stop();
  reloaded.dispose();

  return {
    seed,
    trainSteps: TRAIN_INFER_SPLIT_BUDGET.trainSteps,
    inferSteps: TRAIN_INFER_SPLIT_BUDGET.inferSteps,
    weightsUnchangedAfterInfer: JSON.stringify(weightsBeforeInfer) === JSON.stringify(weightsAfterInfer),
    greedyActionsMatchAfterReload: JSON.stringify(greedyBefore) === JSON.stringify(greedyAfter),
    greedyBefore,
    greedyAfter,
    tensorsBeforeDispose,
    tensorsAfterDispose,
  };
}
