import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { PPOAgent } from '../src/agents/ppo';
import { PPOConfig } from '../src/types';

describe('PPOAgent', () => {
  const config: PPOConfig = {
    inputSize: 4,
    actionSize: 2,
    hiddenLayers: [32],
    gamma: 0.99,
    lr: 3e-4,
    clipRatio: 0.2,
    epochs: 3,
    entropyCoeff: 0.01,
    valueCoeff: 0.5,
    gaeLambda: 0.95,
    maxTrajectoryLength: 16,
  };

  afterEach(() => {
    tf.disposeVariables();
    tf.dispose();
  });

  describe('constructor', () => {
    it('should create an agent with given config', () => {
      const agent = new PPOAgent(config);
      expect(agent).toBeDefined();
      agent.dispose();
    });

    it('should use default values when optional config is omitted', () => {
      const minimal: PPOConfig = { inputSize: 2, actionSize: 3 };
      const agent = new PPOAgent(minimal);
      expect(agent).toBeDefined();
      agent.dispose();
    });
  });

  describe('getAction', () => {
    it('should return a valid action index', async () => {
      const agent = new PPOAgent(config);
      const state = [0.1, 0.2, 0.3, 0.4];
      const result = await agent.getAction(state);

      expect(result.action).toBeGreaterThanOrEqual(0);
      expect(result.action).toBeLessThan(config.actionSize);
      expect(typeof result.logProb).toBe('number');
      expect(typeof result.value).toBe('number');
      expect(Number.isFinite(result.logProb)).toBe(true);
      expect(Number.isFinite(result.value)).toBe(true);

      agent.dispose();
    });

    it('should return different actions over many calls (stochastic policy)', async () => {
      const agent = new PPOAgent(config);
      const state = [0.5, 0.5, 0.5, 0.5];
      const actions = new Set<number>();

      for (let i = 0; i < 50; i++) {
        const { action } = await agent.getAction(state);
        actions.add(action);
      }

      expect(actions.size).toBeGreaterThan(1);
      agent.dispose();
    });
  });

  describe('storeTransition', () => {
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
  });

  describe('train', () => {
    it('should not train when trajectory is empty', async () => {
      const agent = new PPOAgent(config);
      const result = await agent.train(0);
      expect(result).toBeNull();
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

      const lastValue = 0;
      const result = await agent.train(lastValue);

      expect(result).not.toBeNull();
      expect(typeof result!.policyLoss).toBe('number');
      expect(typeof result!.valueLoss).toBe('number');
      expect(typeof result!.entropy).toBe('number');
      expect(Number.isFinite(result!.policyLoss)).toBe(true);
      expect(Number.isFinite(result!.valueLoss)).toBe(true);
      expect(Number.isFinite(result!.entropy)).toBe(true);

      // Trajectory should be cleared after training
      expect(agent.getTrajectoryLength()).toBe(0);

      agent.dispose();
    });
  });

  describe('training loop (integration)', () => {
    it('should train on a simple binary classification environment', async () => {
      const smallConfig: PPOConfig = {
        inputSize: 1,
        actionSize: 2,
        hiddenLayers: [16],
        gamma: 0.99,
        lr: 1e-3,
        clipRatio: 0.2,
        epochs: 4,
        entropyCoeff: 0.01,
        valueCoeff: 0.5,
        gaeLambda: 0.95,
        maxTrajectoryLength: 32,
      };

      const agent = new PPOAgent(smallConfig);
      const numEpisodes = 10;

      for (let ep = 0; ep < numEpisodes; ep++) {
        for (let step = 0; step < smallConfig.maxTrajectoryLength!; step++) {
          const state = [Math.random()];
          const correct = state[0] > 0.5 ? 1 : 0;
          const { action, logProb, value } = await agent.getAction(state);
          const reward = action === correct ? 1 : -1;

          agent.storeTransition({
            state,
            action,
            reward,
            logProb,
            value,
            done: step === smallConfig.maxTrajectoryLength! - 1,
          });
        }

        const result = await agent.train(0);
        expect(result).not.toBeNull();
      }

      // After training, the agent should produce valid actions
      const testAction = await agent.getAction([0.9]);
      expect([0, 1]).toContain(testAction.action);

      agent.dispose();
    }, 30000);
  });

  describe('dispose', () => {
    it('should clean up tensors without error', () => {
      const agent = new PPOAgent(config);
      const tensorsBefore = tf.memory().numTensors;
      agent.dispose();
      const tensorsAfter = tf.memory().numTensors;
      expect(tensorsAfter).toBeLessThanOrEqual(tensorsBefore);
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
});
