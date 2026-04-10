/**
 * Tests PPOAgent
 *
 * 1. Test unitaire : vérification de l'interface (getAction, remember, train)
 * 2. Test de convergence : navigation 1D — l'agent doit apprendre à aller
 *    vers la cible. La récompense moyenne des derniers épisodes doit être
 *    supérieure à celle des premiers.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { PPOAgent } from '../src/agents/ppo';

// ---------------------------------------------------------------------------
// Mini-environnement : navigation 1D (identique au test DQN)
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

afterEach(() => {
  tf.disposeVariables();
});

describe('PPOAgent — interface', () => {
  it('getAction retourne un indice d\'action valide', async () => {
    const agent = new PPOAgent({
      inputSize: 2,
      actionSize: 3,
      hiddenLayers: [8],
    });
    const action = await agent.getAction([0.5, 0.5]);
    expect([0, 1, 2]).toContain(action);
    agent.dispose();
  });

  it('remember puis train ne leve pas d\'erreur', async () => {
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [8],
      batchSize: 4,
    });
    // Collecter quelques expériences
    for (let i = 0; i < 8; i++) {
      const state = [Math.random()];
      const action = await agent.getAction(state);
      agent.remember({ state, action, reward: Math.random(), nextState: [Math.random()], terminated: false, truncated: false });
    }
    await expect(agent.train()).resolves.not.toThrow();
    agent.dispose();
  });

  it('le rollout est vide apres train()', async () => {
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [8],
    });
    const action = await agent.getAction([0.3]);
    agent.remember({ state: [0.3], action, reward: 1, nextState: [0.5], terminated: false, truncated: false });
    await agent.train();
    // Un deuxième train() sur un rollout vide ne doit pas planter
    await expect(agent.train()).resolves.not.toThrow();
    agent.dispose();
  });
});

// ---------------------------------------------------------------------------

describe('PPOAgent — convergence', () => {
  it('la récompense moyenne augmente sur 200 épisodes (navigation 1D)', async () => {
    const agent = new PPOAgent({
      inputSize: 1,
      actionSize: 2,
      hiddenLayers: [32, 32],
      lr: 3e-4,
      gamma: 0.99,
      gaeLambda: 0.95,
      clipRatio: 0.2,
      epochs: 4,
      batchSize: 16,
      entropyCoef: 0.02, // entropie légèrement plus forte pour favoriser l'exploration
      valueLossCoef: 0.5,
    });

    const NUM_EPISODES = 200;
    const MAX_STEPS = 25;
    const episodeRewards: number[] = [];

    for (let ep = 0; ep < NUM_EPISODES; ep++) {
      let pos = Math.random() * 0.4; // départ dans [0, 0.4]
      let totalReward = 0;

      for (let step = 0; step < MAX_STEPS; step++) {
        const state = [pos];
        const action = await agent.getAction(state);
        const { newPos, reward, done } = nav1DStep(pos, action);

        agent.remember({ state, action, reward, nextState: [newPos], terminated: done, truncated: false });
        totalReward += reward;
        pos = newPos;
        if (done) break;
      }

      // PPO est on-policy : mise à jour après chaque épisode
      await agent.train();
      episodeRewards.push(totalReward);
    }

    const firstAvg =
      episodeRewards.slice(0, 40).reduce((a, b) => a + b, 0) / 40;
    const lastAvg =
      episodeRewards.slice(-40).reduce((a, b) => a + b, 0) / 40;

    console.log(
      `[PPO convergence] premiers 40 épisodes: ${firstAvg.toFixed(3)}, ` +
      `derniers 40 épisodes: ${lastAvg.toFixed(3)}`,
    );

    // L'agent doit avoir progressé (politique améliorée)
    expect(lastAvg).toBeGreaterThan(firstAvg);

    agent.dispose();
  }, 90_000);
});
