import { commit, createRepo, uploadFiles, HubApiError } from '@huggingface/hub';
import * as tf from '@tensorflow/tfjs';

import { parseHFConfig } from '../config';
import type { HFStorageConfig } from '../config';
import type { ModelInfo, ModelStorageProvider } from '../types';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Preserve the binary format emitted by TFJS, including multiple weight buffers. */
function combineWeightData(data: NonNullable<tf.io.ModelArtifacts['weightData']>): ArrayBuffer {
  const buffers = Array.isArray(data) ? data : [data];
  const combined = new Uint8Array(buffers.reduce((size, buffer) => size + buffer.byteLength, 0));
  let offset = 0;
  for (const buffer of buffers) {
    combined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return combined.buffer;
}

async function serializeModel(model: tf.LayersModel): Promise<{ document: string; weights: ArrayBuffer }> {
  let serialized: { document: string; weights: ArrayBuffer } | undefined;
  await model.save(tf.io.withSaveHandler(async artifacts => {
    if (!artifacts.modelTopology || !artifacts.weightSpecs || !artifacts.weightData) {
      throw new Error('[HFProvider] Model save did not supply topology and weights');
    }
    const { modelTopology, format, generatedBy, convertedBy, trainingConfig, weightSpecs } = artifacts;
    serialized = {
      document: JSON.stringify({ modelTopology, format, generatedBy, convertedBy, trainingConfig,
        weightsManifest: [{ paths: ['weights.bin'], weights: weightSpecs }] }),
      weights: combineWeightData(artifacts.weightData),
    };
    return { modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts) };
  }));
  if (!serialized) throw new Error('[HFProvider] Model serialization failed');
  return serialized;
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
    const { document, weights } = await serializeModel(model);

    const files: { path: string; content: Blob }[] = [
      {
        path: `${modelId}/model.json`,
        content: new Blob([document], { type: 'application/json' }),
      },
      {
        path: `${modelId}/weights.bin`,
        content: new Blob([weights], { type: 'application/octet-stream' }),
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
    } catch (error) {
      if (!(error instanceof HubApiError) || error.statusCode !== 409) throw error;
    }

    await uploadFiles({
      repo: this.config.repoId,
      accessToken: this.config.token,
      files,
    });

    const uri = `hf://${this.config.repoId}/${modelId}`;
    return uri;
  }

  // ── load ──────────────────────────────────────────────────────────────────

  async load(
    modelId: string,
    maxRetries = 3,
    initialDelay = 2000
  ): Promise<tf.LayersModel> {
    const url = `https://huggingface.co/${this.config.repoId}/resolve/main/${modelId}/model.json`;
    if (!Number.isSafeInteger(maxRetries) || maxRetries < 1
      || !Number.isFinite(initialDelay) || initialDelay < 0) {
      throw new Error('[HFProvider] Retry count must be positive and delay finite/nonnegative');
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = await tf.loadLayersModel(url, {
          requestInit: { headers: { Authorization: `Bearer ${this.config.token}` } },
        });
        return model;
      } catch (err) {
        lastError = err;
        if (attempt + 1 < maxRetries) await sleep(initialDelay * Math.pow(2, attempt));
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
