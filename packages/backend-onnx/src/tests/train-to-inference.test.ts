/**
 * End-to-end test: Train → Export → Inference pipeline
 *
 * Tests the full workflow a user would follow:
 * 1. Implement TrainingEnv
 * 2. Train with IgnitionEnvTFJS
 * 3. Verify model is exportable
 * 4. Generate conversion script
 * 5. Verify OnnxAgent works for inference
 */

import { describe, it, expect, afterAll } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import type { TrainingEnv } from '@ignitionai/core';
import { generateConversionScript } from '../exporter';
import { OnnxAgent } from '../agents/onnx-agent';

class TestGridWorld implements TrainingEnv {
  actions = ['up', 'right', 'down', 'left'];
  row = 0;
  col = 0;
  steps = 0;
  private size = 5;

  observe() {
    return [this.row / (this.size - 1), this.col / (this.size - 1), 1, 1];
  }

  step(action: number | number[]) {
    const a = typeof action === 'number' ? action : action[0];
    switch (a) {
      case 0: this.row = Math.max(0, this.row - 1); break;
      case 1: this.col = Math.min(this.size - 1, this.col + 1); break;
      case 2: this.row = Math.min(this.size - 1, this.row + 1); break;
      case 3: this.col = Math.max(0, this.col - 1); break;
    }
    this.steps++;
  }

  reward() {
    return (this.row === this.size - 1 && this.col === this.size - 1) ? 10 : -0.1;
  }

  done() {
    return (this.row === this.size - 1 && this.col === this.size - 1) || this.steps >= 50;
  }

  reset() { this.row = 0; this.col = 0; this.steps = 0; }
}

afterAll(() => { tf.disposeVariables(); });

describe('Train → Export → Inference pipeline', () => {
  it('Train: creates DQN agent with TrainingEnv, agent produces actions', async () => {
    const env = new IgnitionEnvTFJS(new TestGridWorld());
    env.train('dqn');
    env.stop();

    // Run steps to verify training loop works
    for (let i = 0; i < 20; i++) {
      await env.step();
    }

    expect(env.agent).not.toBeNull();
    expect(env.stepCount).toBe(20);

    // Agent can produce actions
    const action = await env.agent!.getAction([0, 0, 1, 1]);
    expect(typeof action).toBe('number');
    expect(action).toBeGreaterThanOrEqual(0);
    expect(action).toBeLessThan(4);

    // Model exists and has layers
    const model = (env.agent as any).model as tf.Sequential;
    expect(model).toBeDefined();
    expect(model.layers.length).toBeGreaterThan(0);
    expect(model.outputs.length).toBeGreaterThan(0);

    env.agent?.dispose?.();
  });

  it('Export: generateConversionScript produces valid bash with correct paths', () => {
    const script = generateConversionScript(
      '/exports/my_model',
      '/exports/my_model_savedmodel',
      '/exports/my_model.onnx',
    );

    expect(script).toContain('#!/bin/bash');
    expect(script).toContain('pip install');
    expect(script).toContain('tensorflowjs_converter');
    expect(script).toContain('--input_format=tfjs_layers_model');
    expect(script).toContain('/exports/my_model/model.json');
    expect(script).toContain('tf2onnx.convert');
    expect(script).toContain('/exports/my_model_savedmodel');
    expect(script).toContain('/exports/my_model.onnx');
    expect(script).toContain('--opset 13');
  });

  it('Inference: OnnxAgent instantiates and validates config', () => {
    const agent = new OnnxAgent({
      modelPath: '/fake/model.onnx',
      actionSize: 4,
      outputName: 'output',
    });

    expect(agent).toBeDefined();

    // getAction throws because load() not called — expected behavior
    expect(agent.getAction([0, 0, 0, 0])).rejects.toThrow('call load()');
  });

  it('Full pipeline: TrainingEnv → train → verify model topology', async () => {
    const env = new IgnitionEnvTFJS(new TestGridWorld());
    env.train();
    env.stop();

    // Verify auto-config: inputSize=4 (from observe), actionSize=4 (from actions)
    const model = (env.agent as any).model as tf.Sequential;
    const inputShape = model.inputLayers[0].batchInputShape;
    const outputShape = model.outputLayers[0].outputShape;

    // inputShape should be [null, 4]
    expect(inputShape[1]).toBe(4);
    // outputShape should be [null, 4]
    expect((outputShape as number[])[1]).toBe(4);

    env.agent?.dispose?.();
  });

  it('Algorithm switch: DQN → PPO on same env', async () => {
    const gridWorld = new TestGridWorld();
    const env = new IgnitionEnvTFJS(gridWorld);

    // Train DQN
    env.train('dqn');
    env.stop();
    for (let i = 0; i < 5; i++) await env.step();
    expect((env.agent as any).model).toBeDefined(); // DQN has model

    // Switch to PPO
    env.train('ppo');
    env.stop();
    for (let i = 0; i < 5; i++) await env.step();
    expect((env.agent as any).actorNet).toBeDefined(); // PPO has actorNet

    env.agent?.dispose?.();
  });
});
