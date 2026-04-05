/**
 * Test de convergence DQN — Navigation 1D
 *
 * Environnement :
 *   État   : [position] ∈ [0, 1]
 *   Action : 0 = gauche (-0.15), 1 = droite (+0.15)
 *   Reward : +1 si position > 0.7, -0.05 sinon
 *   Épisode: se termine dès que la cible est atteinte ou après MAX_STEPS
 *
 * Convergence prouvée si la moyenne des 50 derniers épisodes
 * est supérieure à la moyenne des 50 premiers.
 */

import { describe, it, expect } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src/agents/dqn';

// ---------------------------------------------------------------------------
// Mini-environnement : navigation 1D vers une cible
// ---------------------------------------------------------------------------

function nav1DStep(
  pos: number,
  action: number,
): { newPos: number; reward: number; done: boolean } {
  const delta = action === 1 ? 0.15 : -0.15;
  const newPos = Math.max(0, Math.min(1, pos + delta));
  const done = newPos > 0.7;
  return { newPos, reward: done ? 1.0 : -0.05, done };
}

// ---------------------------------------------------------------------------

describe('DQN — convergence', () => {
  it('la récompense moyenne augmente sur 200 épisodes (navigation 1D)', async () => {
    const agent = new DQNAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [16, 16],
      epsilon: 1.0,
      epsilonDecay: 0.99,
      minEpsilon: 0.05,
      lr: 0.005,
      gamma: 0.99,
      batchSize: 16,
      memorySize: 2000,
      targetUpdateFrequency: 50,
    });

    const NUM_EPISODES = 200;
    const MAX_STEPS = 20;
    const episodeRewards: number[] = [];

    for (let ep = 0; ep < NUM_EPISODES; ep++) {
      // Départ aléatoire dans [0, 0.4] pour forcer l'apprentissage
      let pos = Math.random() * 0.4;
      let totalReward = 0;

      for (let step = 0; step < MAX_STEPS; step++) {
        const state = [pos];
        const action = await agent.getAction(state);
        const { newPos, reward, done } = nav1DStep(pos, action);

        agent.remember({ state, action, reward, nextState: [newPos], done });
        await agent.train();

        totalReward += reward;
        pos = newPos;
        if (done) break;
      }

      episodeRewards.push(totalReward);
    }

    const firstAvg =
      episodeRewards.slice(0, 50).reduce((a, b) => a + b, 0) / 50;
    const lastAvg =
      episodeRewards.slice(-50).reduce((a, b) => a + b, 0) / 50;

    console.log(
      `[DQN convergence] premiers 50 épisodes: ${firstAvg.toFixed(3)}, ` +
      `derniers 50 épisodes: ${lastAvg.toFixed(3)}`,
    );

    // L'agent doit avoir appris à se diriger vers la cible
    expect(lastAvg).toBeGreaterThan(firstAvg);

    agent.dispose();
    tf.disposeVariables();
  }, 60_000);
});
