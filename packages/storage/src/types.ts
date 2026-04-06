import type * as tf from '@tensorflow/tfjs';

export interface ModelInfo {
  modelId: string;
  uri: string;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ModelStorageProvider {
  /**
   * Serialize and persist a model. Returns the URI where it was stored.
   */
  save(
    modelId: string,
    model: tf.LayersModel,
    metadata?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Load a previously saved model by its ID.
   */
  load(modelId: string): Promise<tf.LayersModel>;

  /**
   * List all models stored by this provider.
   */
  list(): Promise<ModelInfo[]>;

  /**
   * Delete a model and its associated files.
   */
  delete(modelId: string): Promise<void>;

  /**
   * Return true if a model with the given ID exists.
   */
  exists(modelId: string): Promise<boolean>;
}
