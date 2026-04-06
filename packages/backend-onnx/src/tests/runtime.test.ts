import { describe, it, expect, vi } from 'vitest';
import { inspectSession } from '../runtime';

// Mock onnxruntime-node
vi.mock('onnxruntime-node', () => {
  const mockSession = {
    inputNames: ['input_0'],
    outputNames: ['output_0'],
    run: vi.fn(async () => ({
      output_0: { data: new Float32Array([0.2, 0.8]) },
    })),
  };

  return {
    InferenceSession: { create: vi.fn(async () => mockSession) },
    Tensor: vi.fn((type: string, data: Float32Array, shape: number[]) => ({ type, data, dims: shape })),
  };
});

describe('runtime', () => {
  it('createOnnxSession creates a session with default cpu provider', async () => {
    const { createOnnxSession } = await import('../runtime');
    const ort = await import('onnxruntime-node');

    const session = await createOnnxSession('/fake/model.onnx');
    expect(ort.InferenceSession.create).toHaveBeenCalledWith('/fake/model.onnx', {
      executionProviders: ['cpu'],
    });
    expect(session).toBeDefined();
  });

  it('runInference returns Float32Array output', async () => {
    const { createOnnxSession, runInference } = await import('../runtime');
    const session = await createOnnxSession('/fake/model.onnx');

    const output = await runInference(
      session,
      new Float32Array([1, 2, 3, 4]),
      [1, 4],
      'input_0',
      'output_0',
    );
    expect(output).toBeInstanceOf(Float32Array);
    expect(output.length).toBe(2);
    expect(output[1]).toBeCloseTo(0.8);
  });

  it('runInference throws on missing output tensor name', async () => {
    const { createOnnxSession, runInference } = await import('../runtime');
    const session = await createOnnxSession('/fake/model.onnx');

    await expect(
      runInference(session, new Float32Array([1]), [1, 1], 'input_0', 'wrong_output'),
    ).rejects.toThrow('"wrong_output" not found');
  });

  it('inspectSession returns input/output names', async () => {
    const { createOnnxSession } = await import('../runtime');
    const session = await createOnnxSession('/fake/model.onnx');
    const { inputs, outputs } = inspectSession(session);
    expect(inputs).toEqual(['input_0']);
    expect(outputs).toEqual(['output_0']);
  });
});
