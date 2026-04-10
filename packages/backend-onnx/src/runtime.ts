import type { InferenceSession as NodeInferenceSession } from 'onnxruntime-node';

export type OrtSession = NodeInferenceSession;
export type OrtTensor = NodeInferenceSession.OnnxValueMapType[string];

/**
 * Creates an ONNX InferenceSession from a model path or buffer.
 * Uses onnxruntime-node in Node.js environments.
 */
export async function createOnnxSession(
  model: string | Buffer | Uint8Array,
  executionProviders: string[] = ['cpu'],
): Promise<OrtSession> {
  const ort = await import('onnxruntime-node');
  const session = await ort.InferenceSession.create(model as string, {
    executionProviders: executionProviders as NodeInferenceSession.ExecutionProviderConfig[],
  });
  return session;
}

/**
 * Runs a forward pass through an ONNX session.
 * @param session   - Active InferenceSession
 * @param inputData - Flat Float32Array of the input tensor
 * @param inputShape - Shape of the input tensor (e.g. [1, 4] for batch of 1, 4 features)
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
  const ort = await import('onnxruntime-node');
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
 * Useful for debugging when the tensor names are unknown.
 */
export function inspectSession(session: OrtSession): { inputs: string[]; outputs: string[] } {
  return {
    inputs: session.inputNames as unknown as string[],
    outputs: session.outputNames as unknown as string[],
  };
}
