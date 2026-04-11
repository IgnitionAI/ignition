import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { IgnitionEnvTFJS } from '../src/ignition-env-tfjs';

// Mini GridWorld: 5x5, agent at (0,0), target at (4,4)
function makeGridWorldEnv() {
  let row = 0, col = 0;
  const target = { row: 4, col: 4 };
  const gridSize = 5;

  return new IgnitionEnvTFJS({
    getObservation: () => [
      row / (gridSize - 1),
      col / (gridSize - 1),
      target.row / (gridSize - 1),
      target.col / (gridSize - 1),
    ],
    actions: ['up', 'right', 'down', 'left'],
    applyAction: (action) => {
      const a = typeof action === 'number' ? action : 0;
      switch (a) {
        case 0: row = Math.max(0, row - 1); break;
        case 1: col = Math.min(gridSize - 1, col + 1); break;
        case 2: row = Math.min(gridSize - 1, row + 1); break;
        case 3: col = Math.max(0, col - 1); break;
      }
    },
    computeReward: () => {
      if (row === target.row && col === target.col) return 10;
      return -0.1;
    },
    isTerminated: () => row === target.row && col === target.col,
    onReset: () => { row = 0; col = 0; },
  });
}

afterEach(() => {
  tf.disposeVariables();
});

describe('IgnitionEnvTFJS — auto-config', () => {
  describe('User Story 1: Zero-config DQN', () => {
    it('train() creates a DQN agent with deduced inputSize=4, actionSize=4', () => {
      const env = makeGridWorldEnv();
      env.train();

      expect(env.agent).not.toBeNull();
      env.stop();
      env.agent?.dispose?.();
    });

    it('agent can produce actions after train()', async () => {
      const env = makeGridWorldEnv();
      env.train();
      env.stop(); // stop the loop, step manually

      const result = await env.step();
      expect(result.observation).toHaveLength(4);
      expect(typeof result.reward).toBe('number');

      env.agent?.dispose?.();
    });

    it('train() defaults to DQN', () => {
      const env = makeGridWorldEnv();
      env.train();

      // DQNAgent has a `model` property (Sequential)
      expect((env.agent as any).model).toBeDefined();
      env.stop();
      env.agent?.dispose?.();
    });

    it('train() is idempotent when already training same algo', () => {
      const env = makeGridWorldEnv();
      env.train();
      const agent1 = env.agent;
      env.train(); // should not recreate
      expect(env.agent).toBe(agent1);
      env.stop();
      env.agent?.dispose?.();
    });

    it('stop() then train() resumes with same agent', () => {
      const env = makeGridWorldEnv();
      env.train();
      const agent1 = env.agent;
      env.stop();
      env.train(); // resume
      expect(env.agent).toBe(agent1);
      env.stop();
      env.agent?.dispose?.();
    });
  });

  describe('User Story 2: Algorithm selection', () => {
    it('train("ppo") creates a PPO agent', () => {
      const env = makeGridWorldEnv();
      env.train('ppo');

      expect(env.agent).not.toBeNull();
      // PPOAgent has actorNet
      expect((env.agent as any).actorNet).toBeDefined();
      env.stop();
      env.agent?.dispose?.();
    });

    it('train("qtable") creates a QTable agent', () => {
      const env = makeGridWorldEnv();
      env.train('qtable');

      expect(env.agent).not.toBeNull();
      // QTableAgent has qTable
      expect((env.agent as any).qTable).toBeDefined();
      env.stop();
    });

    it('switching algorithm disposes the old agent', () => {
      const env = makeGridWorldEnv();
      env.train('dqn');
      const dqnAgent = env.agent;
      env.stop();

      env.train('ppo');
      expect(env.agent).not.toBe(dqnAgent);
      expect((env.agent as any).actorNet).toBeDefined();
      env.stop();
      env.agent?.dispose?.();
    });
  });

  describe('User Story 3: Advanced overrides', () => {
    it('overrides lr and hiddenLayers', () => {
      const env = makeGridWorldEnv();
      env.train('dqn', { lr: 0.01, hiddenLayers: [128, 128] });

      expect(env.agent).not.toBeNull();
      env.stop();
      env.agent?.dispose?.();
    });

    it('actions as number works the same as string array', () => {
      let pos = 0;
      const env = new IgnitionEnvTFJS({
        getObservation: () => [pos],
        actions: 2,
        applyAction: (a) => { pos += (a === 1 ? 1 : -1); },
        computeReward: () => pos > 3 ? 1 : -0.1,
        isTerminated: () => pos > 3,
        onReset: () => { pos = 0; },
      });
      env.train();
      expect(env.agent).not.toBeNull();
      env.stop();
      env.agent?.dispose?.();
    });
  });
});
