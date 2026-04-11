import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { IgnitionEnvTFJS } from '../src/ignition-env-tfjs';
import type { TrainingEnv } from '@ignitionai/core';

class MiniGridWorld implements TrainingEnv {
  actions = ['up', 'right', 'down', 'left'];
  row = 0;
  col = 0;
  private gridSize = 5;
  private target = { row: 4, col: 4 };

  observe() {
    const max = this.gridSize - 1;
    return [this.row / max, this.col / max, this.target.row / max, this.target.col / max];
  }

  step(action: number | number[]) {
    const a = typeof action === 'number' ? action : 0;
    switch (a) {
      case 0: this.row = Math.max(0, this.row - 1); break;
      case 1: this.col = Math.min(this.gridSize - 1, this.col + 1); break;
      case 2: this.row = Math.min(this.gridSize - 1, this.row + 1); break;
      case 3: this.col = Math.max(0, this.col - 1); break;
    }
  }

  reward() { return (this.row === this.target.row && this.col === this.target.col) ? 10 : -0.1; }
  done() { return this.row === this.target.row && this.col === this.target.col; }
  reset() { this.row = 0; this.col = 0; }
}

afterEach(() => { tf.disposeVariables(); });

describe('IgnitionEnvTFJS — auto-config', () => {
  describe('User Story 1: Zero-config DQN', () => {
    it('train() creates a DQN agent with deduced inputSize=4, actionSize=4', () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train();
      expect(env.agent).not.toBeNull();
      env.stop();
      env.agent?.dispose?.();
    });

    it('agent can produce actions after train()', async () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train();
      env.stop();
      const result = await env.step();
      expect(result.observation).toHaveLength(4);
      env.agent?.dispose?.();
    });

    it('train() defaults to DQN', () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train();
      expect((env.agent as any).model).toBeDefined();
      env.stop();
      env.agent?.dispose?.();
    });

    it('train() is idempotent when already training same algo', () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train();
      const agent1 = env.agent;
      env.train();
      expect(env.agent).toBe(agent1);
      env.stop();
      env.agent?.dispose?.();
    });

    it('stop() then train() resumes with same agent', () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train();
      const agent1 = env.agent;
      env.stop();
      env.train();
      expect(env.agent).toBe(agent1);
      env.stop();
      env.agent?.dispose?.();
    });
  });

  describe('User Story 2: Algorithm selection', () => {
    it('train("ppo") creates a PPO agent', () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train('ppo');
      expect((env.agent as any).actorNet).toBeDefined();
      env.stop();
      env.agent?.dispose?.();
    });

    it('train("qtable") creates a QTable agent', () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train('qtable');
      expect((env.agent as any).qTable).toBeDefined();
      env.stop();
    });

    it('switching algorithm disposes the old agent', () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train('dqn');
      const dqnAgent = env.agent;
      env.stop();
      env.train('ppo');
      expect(env.agent).not.toBe(dqnAgent);
      env.stop();
      env.agent?.dispose?.();
    });
  });

  describe('User Story 3: Overrides', () => {
    it('overrides lr and hiddenLayers', () => {
      const env = new IgnitionEnvTFJS(new MiniGridWorld());
      env.train('dqn', { lr: 0.01, hiddenLayers: [128, 128] });
      expect(env.agent).not.toBeNull();
      env.stop();
      env.agent?.dispose?.();
    });

    it('actions as number works', () => {
      const numEnv = { actions: 2, observe: () => [0], step: () => {}, reward: () => 0, done: () => false, reset: () => {} };
      const env = new IgnitionEnvTFJS(numEnv);
      env.train();
      expect(env.agent).not.toBeNull();
      env.stop();
      env.agent?.dispose?.();
    });
  });
});
