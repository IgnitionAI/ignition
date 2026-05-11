import type { InferenceSession } from 'onnxruntime-common';

export type OrtSession = InferenceSession;

/**
 * Dynamically imports the correct ONNX runtime:
 * - `onnxruntime-node` in Node.js environments
 * - `onnxruntime-web` in browser environments
 *
 * This avoids bundling both runtimes. Only the one matching your target
 * environment will be included in the final bundle.
 */
async function getOrt() {
  if (typeof window !== 'undefined' || typeof importScripts !== 'undefined') {
    // Browser or Web Worker
    return import('onnxruntime-web');
  }
  // Node.js
  return import('onnxruntime-node');
}

/**
 * Creates an ONNX InferenceSession from a model path, Buffer, Uint8Array, or ArrayBuffer.
 * Auto-detects Node vs browser and loads the appropriate runtime.
 */
export async function createOnnxSession(
  model: string | Buffer | Uint8Array | ArrayBuffer,
  executionProviders: string[] = ['cpu'],
): Promise<OrtSession> {
  const ort = await getOrt();

  // Handle ArrayBuffer (browser fetch response) by converting to Uint8Array
  let modelData: string | Uint8Array = model as string | Uint8Array;
  if (model instanceof ArrayBuffer) {
    modelData = new Uint8Array(model);
  }

  // TypeScript overload resolution doesn't handle string | Uint8Array unions well
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await ort.InferenceSession.create(modelData as any, {
    executionProviders: executionProviders as InferenceSession.ExecutionProviderConfig[],
  });
  return session;
}

/**
 * Runs a forward pass through an ONNX session.
 * @param session   - Active InferenceSession
 * @param inputData - Flat Float32Array of the input tensor
 * @param inputShape - Shape of the input tensor (e.g. [1, 4])
 * @param inputName  - ONNX graph input tensor name
 * @param outputName - ONNX graph output tensor name
 * @returns Flat Float32Array of the output tensor (e.g. Q-values)
 */
export async function runInference(
  session: OrtSession,
  inputData: Float32Array,
  inputShape: number[],
  inputName: string,
  outputName: string,
): Promise<Float32Array> {
  const ort = await getOrt();
  const tensor = new ort.Tensor('float32', inputData, inputShape);
  const feeds: Record<string, typeof tensor> = { [inputName]: tensor };
  const results = await session.run(feeds);
  const output = results[outputName];
  if (!output) {
    throw new Error(
      `ONNX output tensor "${outputName}" not found. Available: ${Object.keys(results).join(', ')}`,
    );
  }
  return output.data as Float32Array;
}

/**
 * Returns the list of input/output tensor names for a session.
 */
export function inspectSession(session: OrtSession): { inputs: string[]; outputs: string[] } {
  return {
    inputs: session.inputNames as unknown as string[],
    outputs: session.outputNames as unknown as string[],
  };
}
