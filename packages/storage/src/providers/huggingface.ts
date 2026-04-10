import { commit, createRepo, uploadFiles } from '@huggingface/hub';
import * as tf from '@tensorflow/tfjs';

import { parseHFConfig } from '../config';
import type { HFStorageConfig } from '../config';
import type { ModelInfo, ModelStorageProvider } from '../types';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Serialize a LayersModel weights into a single Float32Array buffer.
 * Mirrors the approach in packages/backend-tfjs/src/io/saveModelToHub.ts
 * but without writing to disk.
 */
function serializeWeights(model: tf.LayersModel): ArrayBuffer {
  const weights = model.getWeights();
  const totalSize = weights.reduce((acc, w) => acc + w.size, 0);
  const data = new Float32Array(totalSize);
  let offset = 0;
  for (const w of weights) {
    data.set(w.dataSync(), offset);
    offset += w.size;
  }
  return data.buffer;
}

export class HuggingFaceProvider implements ModelStorageProvider {
  private readonly config: HFStorageConfig;

  /**
   * @param config  Explicit config object. When omitted, reads HF_TOKEN and
   *                HF_REPO_ID from process.env and validates with Zod.
   */
  constructor(config?: HFStorageConfig) {
    this.config = config ?? parseHFConfig();
  }

  // ── save ──────────────────────────────────────────────────────────────────

  async save(
    modelId: string,
    model: tf.LayersModel,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const modelJSON = model.toJSON();
    const weightBuffer = serializeWeights(model);

    const files: { path: string; content: Blob }[] = [
      {
        path: `${modelId}/model.json`,
        content: new Blob([JSON.stringify(modelJSON)], { type: 'application/json' }),
      },
      {
        path: `${modelId}/weights.bin`,
        content: new Blob([weightBuffer], { type: 'application/octet-stream' }),
      },
    ];

    if (metadata) {
      files.push({
        path: `${modelId}/metadata.json`,
        content: new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
      });
    }

    try {
      await createRepo({
        repo: this.config.repoId,
        accessToken: this.config.token,
      });
    } catch {
      // Repo already exists — not an error
    }

    await uploadFiles({
      repo: this.config.repoId,
      accessToken: this.config.token,
      files,
    });

    const uri = `hf://${this.config.repoId}/${modelId}`;
    console.log(`[HFProvider] ✅ Saved to ${uri}`);
    return uri;
  }

  // ── load ──────────────────────────────────────────────────────────────────

  async load(
    modelId: string,
    maxRetries = 3,
    initialDelay = 2000
  ): Promise<tf.LayersModel> {
    const url = `https://huggingface.co/${this.config.repoId}/resolve/main/${modelId}/model.json`;
    console.log(`[HFProvider] Loading model from: ${url}`);

    let lastError: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = (await tf.loadLayersModel(url)) as tf.LayersModel;
        console.log(`[HFProvider] ✅ Model loaded (${modelId})`);
        return model;
      } catch (err) {
        lastError = err;
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(
          `[HFProvider] ⚠️ Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms…`
        );
        await sleep(delay);
      }
    }

    throw lastError;
  }

  // ── list ──────────────────────────────────────────────────────────────────

  async list(): Promise<ModelInfo[]> {
    const url = `https://huggingface.co/api/models/${this.config.repoId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.config.token}` },
    });

    if (!response.ok) {
      throw new Error(`[HFProvider] Failed to list models: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { siblings?: { rfilename: string }[] };
    const siblings = data.siblings ?? [];

    // Find unique top-level directories that contain a model.json
    const modelIds = new Set<string>();
    for (const { rfilename } of siblings) {
      const parts = rfilename.split('/');
      if (parts.length === 2 && parts[1] === 'model.json') {
        modelIds.add(parts[0]);
      }
    }

    return Array.from(modelIds).map(modelId => ({
      modelId,
      uri: `hf://${this.config.repoId}/${modelId}`,
    }));
  }

  // ── delete ────────────────────────────────────────────────────────────────

  async delete(modelId: string): Promise<void> {
    await commit({
      repo: this.config.repoId,
      accessToken: this.config.token,
      title: `Delete model ${modelId}`,
      operations: [
        { operation: 'delete', path: `${modelId}/model.json` },
        { operation: 'delete', path: `${modelId}/weights.bin` },
        { operation: 'delete', path: `${modelId}/metadata.json` },
      ],
    });
    console.log(`[HFProvider] ✅ Deleted model "${modelId}"`);
  }

  // ── exists ────────────────────────────────────────────────────────────────

  async exists(modelId: string): Promise<boolean> {
    const url = `https://huggingface.co/${this.config.repoId}/resolve/main/${modelId}/model.json`;
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${this.config.token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
