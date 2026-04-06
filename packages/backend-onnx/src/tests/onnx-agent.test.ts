import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnnxAgent } from '../agents/onnx-agent';

// Mock onnxruntime-node to avoid native binary dependency in CI
vi.mock('onnxruntime-node', () => {
  const mockRun = vi.fn(async (feeds: Record<string, unknown>) => ({
    output: {
      data: new Float32Array([0.1, 0.9, 0.3, 0.2]),
    },
  }));

  const mockSession = {
    run: mockRun,
    inputNames: ['dense_input'],
    outputNames: ['output'],
  };

  return {
    InferenceSession: {
      create: vi.fn(async () => mockSession),
    },
    Tensor: vi.fn((type: string, data: Float32Array, shape: number[]) => ({
      type,
      data,
      dims: shape,
    })),
  };
});

describe('OnnxAgent', () => {
  let agent: OnnxAgent;

  beforeEach(() => {
    agent = new OnnxAgent({
      modelPath: '/fake/model.onnx',
      actionSize: 4,
      outputName: 'output',
    });
  });

  it('throws if getAction() called before load()', async () => {
    await expect(agent.getAction([0, 1, 2, 3])).rejects.toThrow('call load()');
  });

  it('loads and returns argmax of Q-values', async () => {
    await agent.load();
    const action = await agent.getAction([0.1, 0.2, 0.3, 0.4]);
    // Mock Q-values: [0.1, 0.9, 0.3, 0.2] → argmax = 1
    expect(action).toBe(1);
  });

  it('returns action in [0, actionSize)', async () => {
    await agent.load();
    const action = await agent.getAction([1, 0, 0, 0]);
    expect(action).toBeGreaterThanOrEqual(0);
    expect(action).toBeLessThan(4);
  });

  it('remember() is a no-op and does not throw', () => {
    expect(() =>
      agent.remember({ state: [0], action: 0, reward: 1, nextState: [1], done: false }),
    ).not.toThrow();
  });

  it('train() is a no-op and resolves', async () => {
    await expect(agent.train()).resolves.toBeUndefined();
  });

  it('inspect() returns tensor names after load', async () => {
    await agent.load();
    const { inputs, outputs } = agent.inspect();
    expect(inputs).toContain('dense_input');
    expect(outputs).toContain('output');
  });

  it('dispose() clears the session', () => {
    agent.dispose();
    expect(() => agent.inspect()).toThrow('call load()');
  });
});
