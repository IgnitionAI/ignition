import * as tf from '@tensorflow/tfjs';
import type { ModelInfo, ModelStorageProvider } from '../types';

const META_PREFIX = 'ignition:meta:';

/**
 * Browser-only provider that persists TF.js models in localStorage.
 * Good for small configs & metadata. Models > 5MB will fail.
 */
export class LocalStorageProvider implements ModelStorageProvider {
  async save(
    modelId: string,
    model: tf.LayersModel,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const uri = `localstorage://${modelId}`;
    await model.save(uri);

    if (metadata) {
      localStorage.setItem(`${META_PREFIX}${modelId}`, JSON.stringify({
        ...metadata,
        savedAt: new Date().toISOString(),
      }));
    }

    console.log(`[LocalStorageProvider] ✅ Saved to ${uri}`);
    return uri;
  }

  async load(modelId: string): Promise<tf.LayersModel> {
    const uri = `localstorage://${modelId}`;
    console.log(`[LocalStorageProvider] Loading from ${uri}`);
    const model = await tf.loadLayersModel(uri);
    console.log(`[LocalStorageProvider] ✅ Loaded ${modelId}`);
    return model;
  }

  async list(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(META_PREFIX)) {
        const modelId = key.slice(META_PREFIX.length);
        try {
          const meta = JSON.parse(localStorage.getItem(key) || '{}');
          models.push({
            modelId,
            uri: `localstorage://${modelId}`,
            createdAt: meta.savedAt ? new Date(meta.savedAt) : undefined,
            metadata: meta,
          });
        } catch {
          models.push({ modelId, uri: `localstorage://${modelId}` });
        }
      }
    }
    return models;
  }

  async delete(modelId: string): Promise<void> {
    // TF.js stores under 'tfjs_localstorage_model_name' keys
    // We clear all localStorage keys for this model
    const prefix = `tfjs_localstorage_${modelId}`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix) || key === `${META_PREFIX}${modelId}`) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    console.log(`[LocalStorageProvider] ✅ Deleted ${modelId} (${keysToRemove.length} keys)`);
  }

  async exists(modelId: string): Promise<boolean> {
    try {
      await tf.loadLayersModel(`localstorage://${modelId}`);
      return true;
    } catch {
      return false;
    }
  }
}
