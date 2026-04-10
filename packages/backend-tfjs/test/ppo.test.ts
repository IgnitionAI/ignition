import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';

import { PPOAgent } from '../src/agents/ppo';
import { RolloutBuffer } from '../src/memory/RolloutBuffer';
import { buildActorCritic } from '../src/model/BuildActorCritic';
import { PPOConfig } from '../src/types';

function tensorCount(): number {
  return tf.memory().numTensors;
}

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
    buffer.add([1, 0], 0, 1.0, 0.5, -0.1, false);
    buffer.add([0, 1], 1, 2.0, 1.0, -0.2, false);
    buffer.add([1, 1], 0, 3.0, 1.5, -0.3, true);

    const { advantages, returns } = buffer.computeAdvantagesAndReturns(0.99, 0.95);
    expect(advantages).toHaveLength(3);
    expect(returns).toHaveLength(3);
    advantages.forEach(value => expect(Number.isFinite(value)).toBe(true));
    returns.forEach(value => expect(Number.isFinite(value)).toBe(true));
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

    expect(buffer.getData()).toEqual({
      states: [[1.0, 2.0], [3.0, 4.0]],
      actions: [1, 0],
      rewards: [0.5, -0.5],
      values: [0.3, -0.2],
      logProbs: [-0.1, -0.8],
      dones: [false, true],
    });
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
    expect(outputs[0].shape).toEqual([2, 3]);
    expect(outputs[1].shape).toEqual([2, 1]);

    for (const sum of outputs[0].sum(1).dataSync()) {
      expect(sum).toBeCloseTo(1.0, 4);
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

describe('PPOAgent', () => {
  const config: PPOConfig = {
    inputSize: 4,
    actionSize: 2,
    hiddenLayers: [16],
    maxTrajectoryLength: 8,
    batchSize: 4,
    epochs: 2,
    lr: 0.001,
    gamma: 0.99,
    gaeLambda: 0.95,
    clipRatio: 0.2,
    entropyCoeff: 0.01,
    valueCoeff: 0.5,
  };

  afterEach(() => {
    tf.disposeVariables();
  });

  describe('constructor', () => {
    it('should create an agent with given config', () => {
      const agent = new PPOAgent(config);
      expect(agent).toBeDefined();
      agent.dispose();
    });

    it('should use default values when optional config is omitted', () => {
      const agent = new PPOAgent({ inputSize: 2, actionSize: 3 });
      expect(agent).toBeDefined();
      agent.dispose();
    });

    it('should preserve config aliases', () => {
      const agent = new PPOAgent({
        inputSize: 4,
        actionSize: 2,
        nSteps: 16,
        valueLossCoeff: 1.25,
      });
      const internals = agent as unknown as Record<string, number>;

      expect(internals.nSteps).toBe(16);
      expect(internals.maxTrajectoryLength).toBe(16);
      expect(internals.valueLossCoeff).toBe(1.25);
      expect(internals.valueCoeff).toBe(1.25);
      agent.dispose();
    });
  });

  describe('getAction', () => {
    it('should return a valid action result', async () => {
      const agent = new PPOAgent(config);
      const result = await agent.getAction([0.1, 0.2, 0.3, 0.4]);

      expect(result.action).toBeGreaterThanOrEqual(0);
      expect(result.action).toBeLessThan(config.actionSize);
      expect(Number.isFinite(result.logProb)).toBe(true);
      expect(Number.isFinite(result.value)).toBe(true);
      agent.dispose();
    });

    it('should return different actions over many calls', async () => {
      const agent = new PPOAgent(config);
      const actions = new Set<number>();

      for (let i = 0; i < 50; i++) {
        actions.add((await agent.getAction([0.5, 0.5, 0.5, 0.5])).action);
      }

      expect(actions.size).toBeGreaterThan(1);
      agent.dispose();
    });
  });

  describe('trajectory collection', () => {
    it('should store a transition without error', () => {
      const agent = new PPOAgent(config);
      agent.storeTransition({
        state: [0.1, 0.2, 0.3, 0.4],
        action: 0,
        reward: 1.0,
        logProb: -0.5,
        value: 0.8,
        done: false,
      });

      expect(agent.getTrajectoryLength()).toBe(1);
      agent.dispose();
    });

    it('should support the legacy remember API', async () => {
      const agent = new PPOAgent(config);
      const { action } = await agent.getAction([0.1, 0.2, 0.3, 0.4]);

      agent.remember({
        state: [0.1, 0.2, 0.3, 0.4],
        action,
        reward: 1.0,
        nextState: [0.5, 0.6, 0.7, 0.8],
        done: false,
      });

      expect(agent.getTrajectoryLength()).toBe(1);
      agent.dispose();
    });
  });

  describe('train', () => {
    it('should not train when trajectory is empty', async () => {
      const agent = new PPOAgent(config);
      await expect(agent.train(0)).resolves.toBeNull();
      agent.dispose();
    });

    it('should train and return loss metrics after collecting transitions', async () => {
      const agent = new PPOAgent(config);

      for (let i = 0; i < config.maxTrajectoryLength!; i++) {
        const state = [Math.random(), Math.random(), Math.random(), Math.random()];
        const { action, logProb, value } = await agent.getAction(state);
        agent.storeTransition({
          state,
          action,
          reward: Math.random(),
          logProb,
          value,
          done: i === config.maxTrajectoryLength! - 1,
        });
      }

      const result = await agent.train(0);
      expect(result).not.toBeNull();
      expect(Number.isFinite(result!.policyLoss)).toBe(true);
      expect(Number.isFinite(result!.valueLoss)).toBe(true);
      expect(Number.isFinite(result!.entropy)).toBe(true);
      expect(agent.getTrajectoryLength()).toBe(0);
      agent.dispose();
    });

    it('should have stable tensor count over multiple training cycles', async () => {
      const agent = new PPOAgent(config);

      for (let cycle = 0; cycle < 5; cycle++) {
        for (let i = 0; i < config.maxTrajectoryLength!; i++) {
          const state = [Math.random(), Math.random(), Math.random(), Math.random()];
          const { action, logProb, value } = await agent.getAction(state);
          agent.storeTransition({
            state,
            action,
            reward: Math.random() * 2 - 1,
            logProb,
            value,
            done: i === config.maxTrajectoryLength! - 1,
          });
        }
        await agent.train(0);
      }

      const tensorsAfterTraining = tensorCount();

      for (let cycle = 0; cycle < 5; cycle++) {
        for (let i = 0; i < config.maxTrajectoryLength!; i++) {
          const state = [Math.random(), Math.random(), Math.random(), Math.random()];
          const { action, logProb, value } = await agent.getAction(state);
          agent.storeTransition({
            state,
            action,
            reward: Math.random() * 2 - 1,
            logProb,
            value,
            done: i === config.maxTrajectoryLength! - 1,
          });
        }
        await agent.train(0);
      }

      expect(tensorCount() - tensorsAfterTraining).toBeLessThan(5);
      agent.dispose();
    });
  });

  describe('reset', () => {
    it('should clear trajectory and reset state', async () => {
      const agent = new PPOAgent(config);
      const { action, logProb, value } = await agent.getAction([0.1, 0.2, 0.3, 0.4]);
      agent.storeTransition({
        state: [0.1, 0.2, 0.3, 0.4],
        action,
        reward: 1.0,
        logProb,
        value,
        done: false,
      });

      expect(agent.getTrajectoryLength()).toBe(1);
      agent.reset();
      expect(agent.getTrajectoryLength()).toBe(0);
      agent.dispose();
    });
  });

  describe('dispose', () => {
    it('should clean up tensors without error', () => {
      const agent = new PPOAgent(config);
      const tensorsBefore = tf.memory().numTensors;
      agent.dispose();
      expect(tf.memory().numTensors).toBeLessThanOrEqual(tensorsBefore);
    });
  });
});
