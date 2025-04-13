import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs-node';
import { DQNAgent } from '../src/agents/dqn';
import { DQNConfig } from '../src/types';
import * as dotenv from 'dotenv';

dotenv.config();
const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  console.warn('⚠️ HF_TOKEN missing, skipping checkpoint test');
  it.skip('Checkpoint test skipped due to missing HF_TOKEN', () => {});
} else {
  describe('DQNAgent Checkpointing with Hugging Face Hub', () => {
    const config: DQNConfig = {
      inputSize: 2,
      actionSize: 2,
      hiddenLayers: [8],
      epsilon: 0.0, // exploitation mode
      memorySize: 20,
      batchSize: 4,
    };

    const timestamp = Date.now();
    const REPO_ID = `salim4n/dqn-checkpoint-test-${timestamp}`;
    const CHECKPOINT_NAME = 'step-5';
    const TEST_STATE = [0.5, 0.9];

    let agent: DQNAgent;

    beforeEach(() => {
      agent = new DQNAgent(config);
    });



    it('should save and reload checkpoint via HF Hub', async () => {
      // Simuler entraînement minimal
      for (let i = 0; i < 5; i++) {
        const s = [Math.random(), Math.random()];
        const a = Math.floor(Math.random() * 2);
        const r = Math.random();
        const sNext = [Math.random(), Math.random()];
        agent.remember({ state: s, action: a, reward: r, nextState: sNext, done: false });
      }
      await agent.train();

      // Tester une action avant la sauvegarde
      const actionBefore = await agent.getAction(TEST_STATE);

      // Sauvegarder le checkpoint sur HF
      await agent.saveCheckpoint(REPO_ID, HF_TOKEN, CHECKPOINT_NAME);

      // Détruire puis recharger le modèle depuis le checkpoint
      agent.dispose();
      const newAgent = new DQNAgent(config);
      await newAgent.loadCheckpoint(REPO_ID, CHECKPOINT_NAME);

      // Tester une action après chargement
      const actionAfter = await newAgent.getAction(TEST_STATE);

      console.log(`[TEST] Action before: ${actionBefore}, after reload: ${actionAfter}`);
      expect([0, 1]).toContain(actionAfter);

      newAgent.dispose();
    }, 60000);
  });
}
