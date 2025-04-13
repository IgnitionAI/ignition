import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu'; // Experimental

/**
 * Initialize TensorFlow.js with the best available backend
 * Preference order: WebGPU > WebGL > CPU > WASM
 * @returns The name of the backend used
 */
export async function initTfjsBackend(): Promise<string> {
  // List of backends in order of preference
  const backends = ['webgpu', 'webgl', 'cpu', 'wasm'];

  // Check which backends are available
  const availableBackends = backends.filter(b => tf.findBackend(b) !== undefined);
  console.log('Available backends:', availableBackends);

  for (const backend of availableBackends) {
    try {
      await tf.setBackend(backend);
      const currentBackend = tf.getBackend();
      console.log(`TensorFlow.js using backend: ${currentBackend}`);
      return currentBackend;
    } catch (error) {
      console.warn(`Unable to initialize ${backend} backend:`, error);
      continue;
    }
  }

  throw new Error('No TensorFlow.js backend available');
}

/**
 * Check if WebGPU is available
 */
export function isWebGPUAvailable(): boolean {
  return 'gpu' in navigator;
}

/**
 * Get information about the current backend
 */
export function getTfjsBackendInfo() {
  const backend = tf.getBackend();
  const memory = tf.memory();
  
  return {
    backend,
    numTensors: memory.numTensors,
    numDataBuffers: memory.numDataBuffers,
    numBytes: memory.numBytes,
    unreliable: memory.unreliable,
  };
}

/**
 * Configure TensorFlow.js backend safely
 * @param name Name of the backend to use ('webgpu', 'webgl', 'cpu', or 'wasm')
 * @returns Promise<void>
 */
export async function setBackendSafe(
  name: 'cpu' | 'webgl' | 'wasm' | 'webgpu' = "webgl"
): Promise<void> {
  // Use findBackend to check if the backend is available
  if (tf.findBackend(name) === undefined) {
    console.warn(`[TFJS] Backend "${name}" is not supported in this environment.`);
    return;
  }

  if (name === 'webgpu') {
    console.warn('⚠️ [TFJS] "webgpu" is experimental and may conflict with WebGL/R3F.');
  }

  try {
    await tf.setBackend(name);
    await tf.ready();
    console.log(`[TFJS] Using backend: ${tf.getBackend()}`);
  } catch (error) {
    console.warn(`[TFJS] Failed to set backend "${name}": ${error.message}`);
    // Fallback to default if available
    if (tf.findBackend('cpu') !== undefined && name !== 'cpu') {
      console.warn('[TFJS] Falling back to CPU backend.');
      await tf.setBackend('cpu');
    }
  }
}
