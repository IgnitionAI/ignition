import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateConversionScript, OnnxAgentConfigSchema } from '@ignitionai/backend-onnx';

describe('ignition-export-onnx API surface on dev', () => {
  it('generateConversionScript is the real exporter, not a mock', () => {
    const script = generateConversionScript('/tfjs-model', '/saved-model', '/out.onnx', 13);
    expect(script).toContain('--input_format=tfjs_layers_model');
    expect(script).toContain('--output_format=keras_saved_model');
    expect(script).toContain('tf2onnx.convert');
    expect(script).toContain('--opset 13');
  });

  it('OnnxAgentConfigSchema defaults match types.ts (no Hub token field)', () => {
    const parsed = OnnxAgentConfigSchema.parse({ modelPath: './model.onnx', actionSize: 2 });
    expect(parsed.executionProviders).toEqual(['cpu']);
    expect(parsed.inputName).toBe('dense_input');
    expect(parsed.outputName).toBe('dense_3');
    expect(Object.keys(OnnxAgentConfigSchema.shape)).not.toContain('token');
  });

  it('loadOnnxModelFromHub source has no token parameter', () => {
    const source = readFileSync(resolve('packages/backend-onnx/src/io/loadOnnxFromHub.ts'), 'utf8');
    expect(source).toContain('export async function loadOnnxModelFromHub');
    expect(source).toMatch(/huggingface\.co\/\$\{repoId\}\/resolve\/main/);
    expect(source.toLowerCase()).not.toMatch(/hf_token|authorization|bearer /);
  });
});
