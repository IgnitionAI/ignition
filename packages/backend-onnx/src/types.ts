import { z } from 'zod';

export const OnnxAgentConfigSchema = z.object({
  /** Path to the .onnx model file, or a Buffer/Uint8Array for in-memory usage */
  modelPath: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Uint8Array)]),
  /** Number of discrete actions the agent can take */
  actionSize: z.number().int().positive(),
  /** ONNX execution providers in priority order */
  executionProviders: z.array(z.string()).default(['cpu']),
  /** Name of the input tensor in the ONNX graph */
  inputName: z.string().default('dense_input'),
  /** Name of the output tensor in the ONNX graph (Q-values) */
  outputName: z.string().default('dense_3'),
});

export type OnnxAgentConfig = z.infer<typeof OnnxAgentConfigSchema>;
