import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs-node';
import { trainAgent } from '../src/tools/trainer';
import { DQNConfig } from '../src/types';
import * as dotenv from 'dotenv';

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  console.warn('⚠️ HF_TOKEN is missing — skipping trainAgent test');
  it.skip('Skipped due to missing HF_TOKEN', () => {});
} else {
  describe('trainAgent integration test with Hugging Face Hub', () => {
    const config: DQNConfig = {
      inputSize: 2,
      actionSize: 2,
      hiddenLayers: [8],
      epsilon: 0.5,
      epsilonDecay: 0.9,
      minEpsilon: 0.1,
      gamma: 0.9,
      batchSize: 4,
      memorySize: 100,
      lr: 0.001,
      targetUpdateFrequency: 5,
    };

    const timestamp = Date.now();
    const repoId = `salim4n/test-train-agent-${timestamp}`;

    const onStep = vi.fn();

    beforeEach(() => {
      onStep.mockClear();
    });


    it('should train agent and checkpoint to Hugging Face', async () => {
      await trainAgent({
        config,
        maxSteps: 10,
        checkpointEvery: 5,
        repoId,
        token: HF_TOKEN!,
        getEnvStep: () => {
          const s = [Math.random(), Math.random()];
          return {
            state: s,
            correctAction: s[0] > 0.5 ? 1 : 0,
            nextState: [Math.random(), Math.random()]
          };
        },
        onStep
      });

      expect(onStep).toHaveBeenCalledTimes(10);
    }, 60000);
  });
}
