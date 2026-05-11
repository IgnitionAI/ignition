import * as tf from '@tensorflow/tfjs';
import type { ModelInfo, ModelStorageProvider } from '../types';

const META_PREFIX = 'ignition:meta:';

/**
 * Browser-only provider that persists TF.js models in IndexedDB.
 * Best for models > 5MB (localStorage quota).
 */
export class IndexedDBProvider implements ModelStorageProvider {
  async save(
    modelId: string,
    model: tf.LayersModel,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const uri = `indexeddb://${modelId}`;
    await model.save(uri);

    if (metadata) {
      localStorage.setItem(`${META_PREFIX}${modelId}`, JSON.stringify({
        ...metadata,
        savedAt: new Date().toISOString(),
      }));
    }

    console.log(`[IndexedDBProvider] ✅ Saved to ${uri}`);
    return uri;
  }

  async load(modelId: string): Promise<tf.LayersModel> {
    const uri = `indexeddb://${modelId}`;
    console.log(`[IndexedDBProvider] Loading from ${uri}`);
    const model = await tf.loadLayersModel(uri);
    console.log(`[IndexedDBProvider] ✅ Loaded ${modelId}`);
    return model;
  }

  async list(): Promise<ModelInfo[]> {
    // TF.js stores keys as 'tfjs_1_model_name' in IndexedDB
    // We use localStorage metadata to list our models
    const models: ModelInfo[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(META_PREFIX)) {
        const modelId = key.slice(META_PREFIX.length);
        try {
          const meta = JSON.parse(localStorage.getItem(key) || '{}');
          models.push({
            modelId,
            uri: `indexeddb://${modelId}`,
            createdAt: meta.savedAt ? new Date(meta.savedAt) : undefined,
            metadata: meta,
          });
        } catch {
          models.push({ modelId, uri: `indexeddb://${modelId}` });
        }
      }
    }
    return models;
  }

  async delete(modelId: string): Promise<void> {
    // TF.js doesn't expose a delete API for IndexedDB
    // We clear metadata and rely on browser quota management
    localStorage.removeItem(`${META_PREFIX}${modelId}`);
    console.log(`[IndexedDBProvider] ⚠️ Metadata cleared for ${modelId}. Model weights remain in IndexedDB until browser cleanup.`);
  }

  async exists(modelId: string): Promise<boolean> {
    try {
      await tf.loadLayersModel(`indexeddb://${modelId}`);
      return true;
    } catch {
      return false;
    }
  }
}
