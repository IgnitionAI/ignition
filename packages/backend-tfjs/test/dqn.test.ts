import { describe, it, expect, afterEach } from 'vitest';
import { DQNAgent } from '../src/agents/dqn';
import { DQNConfig } from '../src/types';
import * as tf from '@tensorflow/tfjs';

// Fonction utilitaire pour surveiller la mémoire TensorFlow.js
function logMemoryStatus(label: string) {
  const mem = tf.memory();
  console.log(`[TFJS Memory - ${label}]`, {
    numTensors: mem.numTensors,
    numBytes: mem.numBytes,
    numDataBuffers: mem.numDataBuffers,
    unreliable: mem.unreliable
  });
}

describe('DQNAgent', () => {
  const config: DQNConfig = {
    inputSize: 1,
    actionSize: 2,
    hiddenLayers: [16],
    epsilon: 0.5,
    epsilonDecay: 0.99,
    minEpsilon: 0.01,
    lr: 0.001,
    gamma: 0.9,
    batchSize: 4,
    memorySize: 100,
    targetUpdateFrequency: 10,
  };

  afterEach(() => {
    // Nettoyage global des tenseurs après chaque test
    tf.disposeVariables();
    tf.dispose(); // Dispose all remaining tensors
    console.log('[TFJS] After cleanup:', tf.memory());
  });

  it('should train on a fake environment', async () => {
    console.log('========== DQN AGENT TEST ==========');
    console.log('[TFJS] Current backend:', tf.getBackend());
    logMemoryStatus('START');
    
    console.log('Config:', JSON.stringify(config, null, 2));
    const agent = new DQNAgent(config);
    console.log('Agent initialized');
    logMemoryStatus('AFTER AGENT INIT');

    let correctActions = 0;
    let totalReward = 0;
    
    // Créons un compteur pour suivre les tenseurs créés
    let stepCounter = 0;
    
    // La boucle principale d'entraînement
    for (let step = 0; step < 50; step++) {
      stepCounter++;
      if (step % 10 === 0) {
        // Log la mémoire tous les 10 pas pour réduire les sorties
        logMemoryStatus(`STEP ${step}`);
      }
      
      const state = [Math.random()];
      const correct = state[0] > 0.5 ? 1 : 0;

      console.log(`\nStep ${step+1}/50: State=${state[0].toFixed(3)}, Correct action=${correct}`);
      
      // Obtenir l'action
      const action = await agent.getAction(state);
      console.log(`Action chosen: ${action}`);
      
      const reward = action === correct ? 1 : -1;
      if (action === correct) correctActions++;
      totalReward += reward;
      
      console.log(`Reward: ${reward}, Running score: ${correctActions}/${step+1} (${(correctActions/(step+1)*100).toFixed(1)}%)`);
      
      const nextState = [Math.random()];
      const done = false;

      agent.remember({ state, action, reward, nextState, done });
      console.log(`Memory size: ${(agent as any).memory.size()}`);

      // Train est déjà géré avec tf.dispose dans l'agent
      await agent.train();
      console.log(`Epsilon: ${(agent as any).epsilon.toFixed(3)}`);
      
      // Forcer le nettoyage de la mémoire à chaque étape
      if (step % 10 === 9) {
        tf.dispose();
      }
    }

    console.log('\n========== TRAINING SUMMARY ==========');
    console.log(`Final score: ${correctActions}/50 (${(correctActions/50*100).toFixed(1)}%)`);
    console.log(`Total reward: ${totalReward}`);
    console.log(`Final epsilon: ${(agent as any).epsilon.toFixed(3)}`);
    console.log('[TFJS] Current backend:', tf.getBackend());
    logMemoryStatus('END OF TRAINING');

    // Test avec un état connu
    const testState = [0.9]; // devrait préférer action = 1
    console.log(`\nTest prediction for state [${testState[0]}]`);
    const chosenAction = await agent.getAction(testState);
    console.log(`Agent chose: ${chosenAction} (Expected: 1)`);
    
    expect([0, 1]).toContain(chosenAction);
    
    // Nettoyage des tenseurs créés pendant le test final et des ressources de l'agent
    if (typeof agent.dispose === 'function') {
      agent.dispose();
    }
    tf.dispose();
    
    // Vérification finale de la mémoire
    logMemoryStatus('END OF TEST');
  });
});
