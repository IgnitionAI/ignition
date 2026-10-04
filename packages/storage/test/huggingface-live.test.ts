import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { HuggingFaceProvider } from '../src/providers/huggingface';

const token = process.env.HF_TOKEN;
const repoId = process.env.HF_TEST_REPO_ID;
const configured = Boolean(token && repoId);
const testName = configured ? 'round-trips a real authenticated model and cleans up its files'
  : 'SKIP: authenticated round-trip requires HF_TOKEN and dedicated private HF_TEST_REPO_ID';

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return token ? message.split(token).join('[REDACTED]') : message;
}
function predict(model: tf.LayersModel): number[] {
  return tf.tidy(() => Array.from((model.predict(tf.tensor2d([[2, -1], [0, 3]])) as tf.Tensor).dataSync()));
}

describe('HuggingFaceProvider authenticated integration', () => {
  it.skipIf(!configured)(testName, async () => {
    if (!token || !repoId) throw new Error('Missing integration configuration');
    const provider = new HuggingFaceProvider({ token, repoId });
    const modelId = `ignition-storage-roundtrip-${randomUUID()}`;
    const models: tf.LayersModel[] = [];
    let writeAttempted = false;
    let failure: string | undefined;
    let cleanup: 'not-needed' | 'passed' | 'failed' = 'not-needed';
    try {
      const access = await fetch(`https://huggingface.co/api/models/${repoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!access.ok) throw new Error(`HF test repository access failed: HTTP ${access.status}`);
      const repository = await access.json() as { private?: boolean };
      if (repository.private !== true) throw new Error('Integration requires an existing private test repository');
      await tf.setBackend('cpu'); await tf.ready();
      const model = tf.sequential(); models.push(model);
      model.add(tf.layers.dense({ inputShape: [2], units: 2, kernelInitializer: 'ones', biasInitializer: 'zeros' }));
      const weights = [tf.tensor2d([1, -2, 3, 4], [2, 2]), tf.tensor1d([0.5, -0.5])];
      model.setWeights(weights); weights.forEach(weight => weight.dispose());
      writeAttempted = true;
      await provider.save(modelId, model, { purpose: 'isolated-storage-roundtrip', contract: 'fixture-v1' });
      const restored = await provider.load(modelId, 3, 1000); models.push(restored);
      expect(restored.inputs[0].shape).toEqual([null, 2]);
      expect(restored.outputs[0].shape).toEqual([null, 2]);
      expect(restored.getWeights().map(weight => Array.from(weight.dataSync())))
        .toEqual([[1, -2, 3, 4], [0.5, -0.5]]);
      expect(predict(restored)).toEqual([-.5, -8.5, 9.5, 11.5]);
      expect(await provider.exists(modelId)).toBe(true);
    } catch (error) {
      failure = safeError(error);
    } finally {
      for (const model of models) model.dispose();
      if (writeAttempted) {
        try {
          await provider.delete(modelId);
          const deleted = await fetch(`https://huggingface.co/${repoId}/resolve/main/${modelId}/model.json`, {
            method: 'HEAD', headers: { Authorization: `Bearer ${token}` },
          });
          if (deleted.status !== 404) throw new Error(`Cleanup read-back returned HTTP ${deleted.status}`);
          cleanup = 'passed';
        } catch (error) {
          cleanup = 'failed';
          failure = `${failure ?? ''} Cleanup failed: ${safeError(error)}`.trim();
        }
      }
      mkdirSync('.scratch', { recursive: true });
      writeFileSync('.scratch/hf-live-roundtrip.json', JSON.stringify({
        checkedAt: new Date().toISOString(), node: process.version, tfjs: tf.version.tfjs,
        repoId, modelId, cleanup, status: failure ? 'failed' : 'passed', error: failure,
        expectedWeights: [[1, -2, 3, 4], [0.5, -0.5]], expectedInference: [-.5, -8.5, 9.5, 11.5],
      }, null, 2));
    }
    if (failure) throw new Error(failure);
  }, 120000);
});
