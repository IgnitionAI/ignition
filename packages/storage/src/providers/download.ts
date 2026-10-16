import * as tf from '@tensorflow/tfjs';
import type { ModelInfo, ModelStorageProvider } from '../types';

/**
 * Browser-only provider that triggers a file download of the model.
 * Write-only: save() works, load() throws.
 */
export class DownloadProvider implements ModelStorageProvider {
  async save(
    modelId: string,
    model: tf.LayersModel,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const uri = `downloads://${modelId}`;
    await model.save(uri);

    if (metadata) {
      // Also download metadata as a separate JSON file
      const metaBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(metaBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${modelId}-metadata.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    console.log(`[DownloadProvider] ✅ Downloaded ${modelId}`);
    return uri;
  }

  async load(): Promise<tf.LayersModel> {
    throw new Error(
      '[DownloadProvider] load() is not supported. ' +
      'Import the downloaded model.json + weights into your project, ' +
      'then use tf.loadLayersModel("file://...").'
    );
  }

  async list(): Promise<ModelInfo[]> {
    console.warn('[DownloadProvider] list() returns empty — downloads are not trackable.');
    return [];
  }

  async delete(): Promise<void> {
    console.warn('[DownloadProvider] delete() is a no-op — downloaded files are on the user\'s disk.');
  }

  async exists(): Promise<boolean> {
    return false;
  }
}
