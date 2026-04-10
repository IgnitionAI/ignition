import * as tf from '@tensorflow/tfjs';

export type TFBackend = 'webgpu' | 'webgl' | 'cpu' | 'wasm' | 'node' | 'auto';

/**
 * Set the TF.js backend. Falls back to 'cpu' if the requested backend is unavailable.
 */
export async function setBackend(backend: TFBackend): Promise<void> {
  if (backend === 'auto') {
    return;
  }

  if (backend === 'node') {
    try {
      require('@tensorflow/tfjs-node');
    } catch (e) {
      console.warn('[backend-selector] @tensorflow/tfjs-node not available, falling back to cpu');
      await tf.setBackend('cpu');
      await tf.ready();
    }
    return;
  }

  if (backend === 'wasm') {
    try {
      require('@tensorflow/tfjs-backend-wasm');
    } catch (e) {
      console.warn('[backend-selector] wasm backend not available, falling back to cpu');
      await tf.setBackend('cpu');
      await tf.ready();
      return;
    }
  }

  try {
    const success = await tf.setBackend(backend);
    if (!success) {
      console.warn(`[backend-selector] Backend '${backend}' could not be set, falling back to cpu`);
      await tf.setBackend('cpu');
    }
    await tf.ready();
  } catch (e) {
    console.warn(`[backend-selector] Failed to set backend '${backend}': ${e}. Falling back to cpu`);
    await tf.setBackend('cpu');
    await tf.ready();
  }
}

/**
 * Returns the list of backends currently registered with TF.js.
 */
export function getAvailableBackends(): string[] {
  return Object.keys((tf as any).engine().registryFactory ?? {});
}
