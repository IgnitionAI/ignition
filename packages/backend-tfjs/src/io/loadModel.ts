import * as tf from '@tensorflow/tfjs';

/**
 * Attendre un délai spécifié en millisecondes
 * @param ms Le nombre de millisecondes à attendre
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load a TensorFlow.js model hosted on Hugging Face Hub.
 * GraphModel is faster and more efficient for inference, but requires more memory.
 * If you want to fine-tune the model, use LayersModel.
 *
 * @param repoId string - full repo name (e.g. "salim4n/my-dqn-model")
 * @param filename string - defaults to "model.json"
 * @param graphModel boolean - defaults to false
 * @param maxRetries number - max number of retry attempts
 * @param initialDelay number - initial delay in ms before first retry
 * @returns tf.LayersModel - the loaded model
 */
export async function loadModelFromHub(
  repoId: string,
  filename: string = 'model.json',
  graphModel: boolean = false,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<tf.LayersModel | tf.GraphModel> {
  const url = `https://huggingface.co/${repoId}/resolve/main/${filename}`;
  console.log(`[HFHub] Loading model from: ${url}`);

  // Tentatives avec backoff exponentiel
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const model = graphModel ? await tf.loadGraphModel(url) : await tf.loadLayersModel(url);
      console.log(`[HFHub] ✅ Model loaded from Hugging Face Hub (${repoId})`);
      return model;
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`[HFHub] ⚠️ Failed to load model on attempt ${attempt + 1}/${maxRetries}. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  console.error(`[HFHub] ❌ Failed to load model from ${url} after ${maxRetries} attempts`);
  throw lastError;
}
