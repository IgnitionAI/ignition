import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { RolloutBuffer } from '../src/memory/RolloutBuffer';
import { buildActorCritic } from '../src/model/BuildActorCritic';
import { PPOAgent } from '../src/agents/ppo';
import { PPOConfig } from '../src/types';

function tensorCount(): number {
  return tf.memory().numTensors;
}

// ============================================================
// Phase 2: Foundational — RolloutBuffer + BuildActorCritic
// ============================================================

describe('RolloutBuffer', () => {
  it('should store experiences and report size', () => {
    const buffer = new RolloutBuffer(4);
    expect(buffer.size()).toBe(0);
    expect(buffer.isFull()).toBe(false);

    buffer.add([0.1, 0.2], 1, 0.5, 0.3, -0.2, false);
    buffer.add([0.3, 0.4], 0, -0.1, 0.1, -0.5, false);
    expect(buffer.size()).toBe(2);
    expect(buffer.isFull()).toBe(false);

    buffer.add([0.5, 0.6], 1, 1.0, 0.8, -0.1, false);
    buffer.add([0.7, 0.8], 0, 0.0, 0.0, -0.3, true);
    expect(buffer.size()).toBe(4);
    expect(buffer.isFull()).toBe(true);
  });

  it('should compute GAE advantages and returns', () => {
    const buffer = new RolloutBuffer(3);
    // Simple trajectory: 3 steps, last one done
    buffer.add([1, 0], 0, 1.0, 0.5, -0.1, false);
    buffer.add([0, 1], 1, 2.0, 1.0, -0.2, false);
    buffer.add([1, 1], 0, 3.0, 1.5, -0.3, true);

    const { advantages, returns } = buffer.computeAdvantagesAndReturns(0.99, 0.95);
    expect(advantages.length).toBe(3);
    expect(returns.length).toBe(3);
    // Advantages should be finite numbers
    advantages.forEach(a => {
      expect(Number.isFinite(a)).toBe(true);
    });
    returns.forEach(r => {
      expect(Number.isFinite(r)).toBe(true);
    });
  });

  it('should clear the buffer', () => {
    const buffer = new RolloutBuffer(2);
    buffer.add([0.1], 0, 1.0, 0.5, -0.1, false);
    buffer.add([0.2], 1, 0.5, 0.3, -0.2, true);
    expect(buffer.size()).toBe(2);
    buffer.clear();
    expect(buffer.size()).toBe(0);
    expect(buffer.isFull()).toBe(false);
  });

  it('should return all stored data via getData()', () => {
    const buffer = new RolloutBuffer(2);
    buffer.add([1.0, 2.0], 1, 0.5, 0.3, -0.1, false);
    buffer.add([3.0, 4.0], 0, -0.5, -0.2, -0.8, true);

    const data = buffer.getData();
    expect(data.states).toEqual([[1.0, 2.0], [3.0, 4.0]]);
    expect(data.actions).toEqual([1, 0]);
    expect(data.rewards).toEqual([0.5, -0.5]);
    expect(data.values).toEqual([0.3, -0.2]);
    expect(data.logProbs).toEqual([-0.1, -0.8]);
    expect(data.dones).toEqual([false, true]);
  });
});

describe('buildActorCritic', () => {
  afterEach(() => {
    tf.disposeVariables();
  });

  it('should build a model with correct output shapes', () => {
    const model = buildActorCritic(4, 3, [32, 32], 0.0003);
    const input = tf.randomNormal([2, 4]);
    const outputs = model.predict(input) as tf.Tensor[];

    expect(outputs).toHaveLength(2);
    // Policy output: [batch, actionSize] with softmax
    expect(outputs[0].shape).toEqual([2, 3]);
    // Value output: [batch, 1]
    expect(outputs[1].shape).toEqual([2, 1]);

    // Policy should sum to ~1 per row (softmax)
    const policySum = outputs[0].sum(1).dataSync();
    for (const s of policySum) {
      expect(s).toBeCloseTo(1.0, 4);
    }

    tf.dispose([input, ...outputs]);
    model.dispose();
  });

  it('should use default hidden layers when not specified', () => {
    const model = buildActorCritic(2, 2);
    const input = tf.randomNormal([1, 2]);
    const outputs = model.predict(input) as tf.Tensor[];

    expect(outputs[0].shape).toEqual([1, 2]);
    expect(outputs[1].shape).toEqual([1, 1]);

    tf.dispose([input, ...outputs]);
    model.dispose();
  });
});

// ============================================================
// Phase 3: US1 — PPOAgent train
// ============================================================

describe('PPOAgent', () => {
  const config: PPOConfig = {
    inputSize: 4,
    actionSize: 2,
    hiddenLayers: [16],
    nSteps: 8,
    batchSize: 4,
    epochs: 2,
    lr: 0.001,
    gamma: 0.99,
    gaeLambda: 0.95,
    clipRatio: 0.2,
    entropyCoeff: 0.01,
    valueLossCoeff: 0.5,
  };

  afterEach(() => {
    tf.disposeVariables();
  });

  it('should construct with default and custom config', () => {
    const minAgent = new PPOAgent({ inputSize: 4, actionSize: 2 });
    expect(minAgent).toBeDefined();
    minAgent.dispose();

    const fullAgent = new PPOAgent(config);
    expect(fullAgent).toBeDefined();
    fullAgent.dispose();
  });

  it('should return a valid action from getAction()', async () => {
    const agent = new PPOAgent(config);
    const action = await agent.getAction([0.1, 0.2, 0.3, 0.4]);
    expect(action).toBeGreaterThanOrEqual(0);
    expect(action).toBeLessThan(2);
    agent.dispose();
  });

  it('should collect experiences and train after nSteps', async () => {
    const agent = new PPOAgent(config);

    // Fill rollout buffer (nSteps = 8)
    for (let i = 0; i < 8; i++) {
      const state = [Math.random(), Math.random(), Math.random(), Math.random()];
      const action = await agent.getAction(state);
      const reward = action === 1 ? 1 : -1;
      const nextState = [Math.random(), Math.random(), Math.random(), Math.random()];
      agent.remember({ state, action, reward, nextState, done: i === 7 });
    }

    // train() should now trigger actual training (buffer is full)
    await agent.train();

    // After training, buffer should be cleared — next train() is a no-op
    await agent.train(); // should not throw

    agent.dispose();
  });

  it('should not train when buffer is not full', async () => {
    const agent = new PPOAgent(config);
    // Add fewer than nSteps experiences
    agent.remember({
      state: [0.1, 0.2, 0.3, 0.4],
      action: 0,
      reward: 1.0,
      nextState: [0.5, 0.6, 0.7, 0.8],
      done: false,
    });
    // Should be a no-op
    await agent.train();
    agent.dispose();
  });

  it('should have stable tensor count over multiple training cycles', async () => {
    const agent = new PPOAgent(config);

    // Run 5 full training cycles
    for (let cycle = 0; cycle < 5; cycle++) {
      for (let i = 0; i < 8; i++) {
        const state = [Math.random(), Math.random(), Math.random(), Math.random()];
        const action = await agent.getAction(state);
        agent.remember({
          state,
          action,
          reward: Math.random() * 2 - 1,
          nextState: [Math.random(), Math.random(), Math.random(), Math.random()],
          done: i === 7,
        });
      }
      await agent.train();
    }

    const tensorsAfterTraining = tensorCount();

    // Run 5 more cycles
    for (let cycle = 0; cycle < 5; cycle++) {
      for (let i = 0; i < 8; i++) {
        const state = [Math.random(), Math.random(), Math.random(), Math.random()];
        const action = await agent.getAction(state);
        agent.remember({
          state,
          action,
          reward: Math.random() * 2 - 1,
          nextState: [Math.random(), Math.random(), Math.random(), Math.random()],
          done: i === 7,
        });
      }
      await agent.train();
    }

    const tensorsAfterMore = tensorCount();
    // Tensor count should not grow significantly (allow small variance for tf internals)
    expect(tensorsAfterMore - tensorsAfterTraining).toBeLessThan(5);

    agent.dispose();
  });

  // ============================================================
  // Phase 4: US2 — Config defaults
  // ============================================================

  it('should apply default config when only inputSize and actionSize given', () => {
    const agent = new PPOAgent({ inputSize: 4, actionSize: 3 });
    // Access internals to verify defaults (cast for test purposes)
    const a = agent as unknown as Record<string, unknown>;
    expect(a['clipRatio']).toBe(0.2);
    expect(a['gaeLambda']).toBe(0.95);
    expect(a['entropyCoeff']).toBe(0.01);
    expect(a['valueLossCoeff']).toBe(0.5);
    expect(a['gamma']).toBe(0.99);
    expect(a['nSteps']).toBe(128);
    expect(a['batchSize']).toBe(64);
    expect(a['epochs']).toBe(4);
    agent.dispose();
  });

  it('should use custom config values when provided', () => {
    const customConfig: PPOConfig = {
      inputSize: 4,
      actionSize: 2,
      clipRatio: 0.1,
      gaeLambda: 0.9,
      entropyCoeff: 0.05,
      valueLossCoeff: 1.0,
      lr: 0.01,
      nSteps: 64,
      batchSize: 32,
      epochs: 8,
      gamma: 0.95,
    };
    const agent = new PPOAgent(customConfig);
    const a = agent as unknown as Record<string, unknown>;
    expect(a['clipRatio']).toBe(0.1);
    expect(a['gaeLambda']).toBe(0.9);
    expect(a['entropyCoeff']).toBe(0.05);
    expect(a['valueLossCoeff']).toBe(1.0);
    expect(a['gamma']).toBe(0.95);
    expect(a['nSteps']).toBe(64);
    expect(a['batchSize']).toBe(32);
    expect(a['epochs']).toBe(8);
    agent.dispose();
  });
});
