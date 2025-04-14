import { DQNAgent } from '@ignitionai/backend-tfjs';
import { IgnitionEnv } from '@ignitionai/core';

const agent = new DQNAgent({
  inputSize: 2,
  actionSize: 3,
  hiddenLayers: [16],
  gamma: 0.95,
  epsilon: 0.5,
  epsilonDecay: 0.99,
  minEpsilon: 0.01,
  lr: 0.001,
  batchSize: 16,
  memorySize: 200,
  targetUpdateFrequency: 5,
});

let position = 0;
let target = Math.random() * 2 - 1;

console.log('Starting training...');

const env: IgnitionEnv = new IgnitionEnv({
  agent,
  getObservation: () => [position, target],
  applyAction: (a: number) => {
    const dx = a - 1;
    position += dx * 0.1;
    if (env.stepCount % 10 === 0) { // Log toutes les 10 étapes
      console.log(`Step ${env.stepCount}: pos=${position.toFixed(2)}, target=${target.toFixed(2)}`);
    }
  },
  computeReward: () => {
    const d = Math.abs(position - target);
    return -d;
  },
  isDone: (): boolean => {
    const d = Math.abs(position - target);
    const done = d < 0.1 || env.stepCount > 1000;
    if (done) {
      console.log(`Training finished at step ${env.stepCount}!`);
      console.log(`Final distance: ${d.toFixed(2)}`);
      env.stop(); // Arrêter explicitement l'environnement
      process.exit(0); // Arrêter le programme
    }
    return done;
  },
  onReset: () => {
    position = 0;
    target = Math.random() * 2 - 1;
    console.log(`[RESET] New target: ${target.toFixed(2)}`);
  },
  stepIntervalMs: 100
});

env.start();
