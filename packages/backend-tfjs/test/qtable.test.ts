/**
 * Tests QTableAgent
 *
 * 1. Test unitaire : interface (getAction, remember, train)
 * 2. Test de convergence : GridWorld 5×5
 *    - L'agent part de (0,0) et doit atteindre la cible (4,4)
 *    - Actions : 0=haut, 1=droite, 2=bas, 3=gauche
 *    - Reward : +1 à la cible, -0.1 sinon
 *    - Convergence : nombre moyen de steps diminue / reward moyenne augmente
 */

import { describe, it, expect } from 'vitest';
import { QTableAgent } from '../src/agents/qtable';

// ---------------------------------------------------------------------------
// Environnement GridWorld 5×5
// ---------------------------------------------------------------------------

const GRID_SIZE = 5;
const TARGET_ROW = 4;
const TARGET_COL = 4;

interface GridState { row: number; col: number }

/** Encode un état de grille en vecteur normalisé [0,1]² */
function encodeState(gs: GridState): number[] {
  return [gs.row / (GRID_SIZE - 1), gs.col / (GRID_SIZE - 1)];
}

/**
 * Transitions GridWorld
 * Actions : 0=haut(-row), 1=droite(+col), 2=bas(+row), 3=gauche(-col)
 */
function gridStep(
  gs: GridState,
  action: number,
): { next: GridState; reward: number; done: boolean } {
  const dRow = [- 1, 0, 1, 0][action];
  const dCol = [0, 1, 0, -1][action];
  const next: GridState = {
    row: Math.max(0, Math.min(GRID_SIZE - 1, gs.row + dRow)),
    col: Math.max(0, Math.min(GRID_SIZE - 1, gs.col + dCol)),
  };
  const done = next.row === TARGET_ROW && next.col === TARGET_COL;
  return { next, reward: done ? 1.0 : -0.1, done };
}

// ---------------------------------------------------------------------------

describe('QTableAgent — interface', () => {
  it('getAction retourne un indice valide', async () => {
    const agent = new QTableAgent({ inputSize: 2, actionSize: 4, stateBins: 5 });
    const action = await agent.getAction([0.5, 0.5]);
    expect([0, 1, 2, 3]).toContain(action);
  });

  it('remember + train ne leve pas d\'erreur', async () => {
    const agent = new QTableAgent({ inputSize: 1, actionSize: 2 });
    agent.remember({ state: [0.3], action: 1, reward: 1, nextState: [0.4], done: false });
    await expect(agent.train()).resolves.not.toThrow();
  });

  it('epsilon décroît après chaque train()', async () => {
    const agent = new QTableAgent({
      inputSize: 1,
      actionSize: 2,
      epsilon: 1.0,
      epsilonDecay: 0.9,
      minEpsilon: 0.01,
    });
    const epsBefore = agent.currentEpsilon;
    agent.remember({ state: [0.5], action: 0, reward: 0, nextState: [0.5], done: false });
    await agent.train();
    expect(agent.currentEpsilon).toBeLessThan(epsBefore);
  });

  it('la table Q grandit avec les états visités', async () => {
    const agent = new QTableAgent({
      inputSize: 1,
      actionSize: 2,
      stateBins: 10,
      epsilon: 1.0, // exploration pure
    });
    for (let i = 0; i < 20; i++) {
      const state = [Math.random()];
      const action = await agent.getAction(state);
      agent.remember({ state, action, reward: 1, nextState: [Math.random()], done: false });
      await agent.train();
    }
    expect(agent.tableSize).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('QTableAgent — convergence GridWorld 5×5', () => {
  it('la récompense moyenne augmente sur 300 épisodes', async () => {
    const agent = new QTableAgent({
      inputSize: 2,
      actionSize: 4,
      stateBins: 5,         // 5 bins/dim → 25 états distincts
      stateLow: [0, 0],
      stateHigh: [1, 1],
      lr: 0.3,              // apprentissage rapide pour les tests
      gamma: 0.99,
      epsilon: 1.0,
      epsilonDecay: 0.99,
      minEpsilon: 0.05,
    });

    const NUM_EPISODES = 300;
    const MAX_STEPS = 50;
    const episodeRewards: number[] = [];

    for (let ep = 0; ep < NUM_EPISODES; ep++) {
      let gs: GridState = { row: 0, col: 0 };
      let totalReward = 0;

      for (let step = 0; step < MAX_STEPS; step++) {
        const state = encodeState(gs);
        const action = await agent.getAction(state);
        const { next, reward, done } = gridStep(gs, action);

        agent.remember({
          state,
          action,
          reward,
          nextState: encodeState(next),
          done,
        });
        await agent.train();

        totalReward += reward;
        gs = next;
        if (done) break;
      }

      episodeRewards.push(totalReward);
    }

    const firstAvg =
      episodeRewards.slice(0, 50).reduce((a, b) => a + b, 0) / 50;
    const lastAvg =
      episodeRewards.slice(-50).reduce((a, b) => a + b, 0) / 50;

    console.log(
      `[QTable convergence] premiers 50 épisodes: ${firstAvg.toFixed(3)}, ` +
      `derniers 50 épisodes: ${lastAvg.toFixed(3)}, ` +
      `états visités: ${agent.tableSize}, ` +
      `epsilon final: ${agent.currentEpsilon.toFixed(3)}`,
    );

    // L'agent doit avoir appris une meilleure politique
    expect(lastAvg).toBeGreaterThan(firstAvg);
  }, 30_000);
});
