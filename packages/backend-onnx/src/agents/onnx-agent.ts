import type { AgentInterface, Experience } from '@ignitionai/core';
import { OnnxAgentConfigSchema, type OnnxAgentConfig } from '../types';
import { createOnnxSession, runInference, inspectSession, type OrtSession } from '../runtime';

/**
 * Inference-only RL agent that loads a pre-trained .onnx model and runs forward passes.
 *
 * Implements AgentInterface — remember() and train() are no-ops since this agent
 * is meant for production inference, not training.
 *
 * Usage:
 * ```ts
 * const agent = new OnnxAgent({ modelPath: './model.onnx', actionSize: 4 });
 * await agent.load();
 * const action = await agent.getAction([0.1, -0.3, 0.5, 0.2]);
 * agent.dispose();
 * ```
 */
export class OnnxAgent implements AgentInterface {
  private config: OnnxAgentConfig;
  private session: OrtSession | null = null;

  constructor(config: OnnxAgentConfig) {
    this.config = OnnxAgentConfigSchema.parse(config);
  }

  /**
   * Loads the ONNX model and creates the inference session.
   * Must be called before getAction().
   */
  async load(): Promise<void> {
    this.session = await createOnnxSession(
      this.config.modelPath as string | Buffer | Uint8Array,
      this.config.executionProviders,
    );
  }

  /**
   * Runs a forward pass through the ONNX model and returns the greedy action (argmax of Q-values).
   * @param observation - State vector as number array
   * @returns Discrete action index in [0, actionSize)
   */
  async getAction(observation: number[]): Promise<number> {
    if (!this.session) {
      throw new Error('OnnxAgent: call load() before getAction()');
    }

    const inputData = new Float32Array(observation);
    const inputShape = [1, observation.length];

    const qValues = await runInference(
      this.session,
      inputData,
      inputShape,
      this.config.inputName,
      this.config.outputName,
    );

    return argmax(qValues);
  }

  /** No-op — ONNX agents do not accumulate experience */
  remember(_experience: Experience): void {}

  /** No-op — ONNX agents do not train */
  async train(): Promise<void> {}

  /**
   * Returns input/output tensor names for debugging.
   * Useful when the default inputName/outputName don't match your ONNX model.
   */
  inspect(): { inputs: string[]; outputs: string[] } {
    if (!this.session) {
      throw new Error('OnnxAgent: call load() before inspect()');
    }
    return inspectSession(this.session);
  }

  /** Releases the ONNX inference session */
  dispose(): void {
    this.session = null;
  }
}

function argmax(values: Float32Array): number {
  let maxIdx = 0;
  let maxVal = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] > maxVal) {
      maxVal = values[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}
