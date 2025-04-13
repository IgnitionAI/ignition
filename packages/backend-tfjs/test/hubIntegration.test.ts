import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs-node';
import { DQNAgent } from '../src/agents/dqn';
import { DQNConfig } from '../src/types';
import { saveModelToHub } from '../src/io/saveModelToHub';
import { loadModelFromHub } from '../src/io/loadModel';
import * as dotenv from 'dotenv';

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
  console.warn('⚠️ Missing HF_TOKEN in .env — skipping Hugging Face test');
  it.skip('Hugging Face test skipped due to missing token', () => {});
} else {
  describe('Hugging Face Hub DQN integration', () => {
    const config: DQNConfig = {
      inputSize: 2,
      actionSize: 2,
      hiddenLayers: [8],
      epsilon: 0.0,
      memorySize: 10,
      batchSize: 4
    };

    const timestamp = Date.now();
    const REPO_ID = `salim4n/tfjs-dqn-test-${timestamp}`;
    const TEST_STATE = [0.2, 0.8];

    let agent: DQNAgent;

    beforeEach(() => {
      agent = new DQNAgent(config);
    });

    afterEach(() => {
      agent && agent.dispose();
      tf.disposeVariables();
      tf.dispose();
    });

    it('should save and load model from Hugging Face Hub', async () => {
      // Entraînement rapide sur quelques steps aléatoires
      for (let i = 0; i < 5; i++) {
        const state = [Math.random(), Math.random()];
        const action = Math.floor(Math.random() * 2);
        const reward = Math.random();
        const nextState = [Math.random(), Math.random()];
        agent.remember({ state, action, reward, nextState, done: false });
      }
      await agent.train();

      // Action avant sauvegarde
      const actionBefore = await agent.getAction(TEST_STATE);
      console.log(`[TEST] Action before save: ${actionBefore}`);

      // Save to HF
      await saveModelToHub(agent['model'], REPO_ID, HF_TOKEN!);
      
      // Attendre que le modèle soit disponible sur Hugging Face Hub
      console.log('[TEST] Waiting for model to be available on Hugging Face Hub...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Charger le modèle avec plus de tentatives et un délai plus long
      console.log('[TEST] Attempting to load model...');
      const newModel = await loadModelFromHub(REPO_ID, 'model/model.json', false, 5, 3000);
      const pred = newModel.predict(tf.tensor2d([TEST_STATE])) as tf.Tensor;
      const output = await pred.array();

      console.log(`[TEST] Prediction after reload:`, output);
      expect(output[0]).toHaveLength(2);
      expect(typeof output[0][0]).toBe('number');

      newModel && newModel.dispose();
      pred && pred.dispose();
    }, 60000);
  });
}
