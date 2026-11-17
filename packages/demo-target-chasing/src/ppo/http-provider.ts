import * as tf from '@tensorflow/tfjs';
import { missingArtifactMessage } from './artifacts';

function modelUrl(baseUrl: string, modelId: string): string {
  const prefix = baseUrl.replace(/\/$/, '');
  const id = modelId.replace(/^\//, '');
  return `${prefix}/${id}/model.json`;
}

/**
 * Read-only HTTP loader for PPO actor/critic directories served from /ppo.
 */
export function httpModelProvider(baseUrl: string) {
  return {
    async save(): Promise<string> {
      throw new Error('Demo checkpoints are read-only');
    },
    async load(modelId: string) {
      const url = modelUrl(baseUrl, modelId);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(missingArtifactMessage(url, response.status));
      }
      return tf.loadLayersModel(url);
    },
    async list() {
      return [];
    },
    async delete(): Promise<void> {
      throw new Error('Demo checkpoints are read-only');
    },
    async exists(modelId: string) {
      const url = modelUrl(baseUrl, modelId);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    },
  };
}
