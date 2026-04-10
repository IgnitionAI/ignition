/**
 * Downloads a .onnx model file from a Hugging Face Hub repository.
 *
 * Usage:
 * ```ts
 * const modelBuffer = await loadOnnxModelFromHub('salim4n/my-dqn-model', 'model.onnx');
 * const agent = new OnnxAgent({ modelPath: modelBuffer, actionSize: 4 });
 * await agent.load();
 * ```
 */

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Downloads a .onnx file from HF Hub and returns it as a Buffer.
 * The Buffer can be passed directly to OnnxAgent as `modelPath`.
 *
 * @param repoId    - HF Hub repo (e.g. "salim4n/my-dqn-model")
 * @param filename  - Filename in the repo (default: "model.onnx")
 * @param maxRetries - Number of retry attempts on failure (default: 3)
 */
export async function loadOnnxModelFromHub(
  repoId: string,
  filename: string = 'model.onnx',
  maxRetries: number = 3,
): Promise<Buffer> {
  const url = `https://huggingface.co/${repoId}/resolve/main/${filename}`;
  console.log(`[HFHub/ONNX] Loading model from: ${url}`);

  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[HFHub/ONNX] ✅ Downloaded ${filename} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
      return buffer;
    } catch (error) {
      lastError = error;
      const delay = 2000 * Math.pow(2, attempt);
      console.warn(
        `[HFHub/ONNX] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
