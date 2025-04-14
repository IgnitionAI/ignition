import { DQNAgent } from '@ignitionai/backend-tfjs';
import { IgnitionEnv } from '@ignitionai/core';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

console.log('Starting training...');
console.log('HF_TOKEN:', process.env.HF_TOKEN ? '✅ Found' : '❌ Not found');

const agent = new DQNAgent({
  inputSize: 2,
  actionSize: 3,
  hiddenLayers: [32, 32],
  gamma: 0.99,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  minEpsilon: 0.01,
  lr: 0.001,
  batchSize: 32,
  memorySize: 1000,
  targetUpdateFrequency: 10,
});

let position = 0;
let target = (Math.random() - 0.5) * 4;
let bestDistance = Infinity;

// Définir la fonction isDone en dehors de la configuration
const isDone = (): boolean => {
  const d = Math.abs(position - target);
  return d < 0.1 || env.stepCount > 1000;
};

const env: IgnitionEnv = new IgnitionEnv({
  agent,
  getObservation: () => [position, target],
  applyAction: (a: number) => {
    const dx = a - 1;
    position += dx * 0.2;
    if (env.stepCount % 10 === 0) {
      console.log(`Step ${env.stepCount}: pos=${position.toFixed(2)}, target=${target.toFixed(2)}`);
    }
  },
  computeReward: () => {
    const d = Math.abs(position - target);
    const reward = 1.0 / (1.0 + d);
    if (env.stepCount % 10 === 0) {
      console.log(`[REWARD] ${reward.toFixed(4)}`);
    }
    return reward;
  },
  isDone,
  onReset: () => {
    position = 0;
    target = (Math.random() - 0.5) * 4;
    console.log(`[RESET] New target: ${target.toFixed(2)}`);
  },
  stepIntervalMs: 100,
  hfRepoId: 'salim4n/dqn-checkpoint-demo',
  hfToken: process.env.HF_TOKEN!,
});

// Étendre la méthode step pour gérer les checkpoints
const originalStep = env.step.bind(env);
env.step = async () => {
  await originalStep();
  
  const d = Math.abs(position - target);
  
  // Sauvegarder un checkpoint si c'est la meilleure performance jusqu'à présent
  if (d < bestDistance) {
    bestDistance = d;
    console.log(`[CHECKPOINT] Nouvelle meilleure distance: ${d.toFixed(4)}`);
    console.log(`[CHECKPOINT] Sauvegarde du meilleur modèle...`);
    await agent.saveCheckpoint(
      'salim4n/dqn-checkpoint-demo',
      process.env.HF_TOKEN!,
      'best'
    );
    console.log(`[CHECKPOINT] ✅ Meilleur modèle sauvegardé`);
  }
  
  // Sauvegarder un checkpoint tous les 100 steps
  if (env.stepCount % 100 === 0) {
    console.log(`[CHECKPOINT] Sauvegarde régulière à l'étape ${env.stepCount}`);
    await agent.saveCheckpoint(
      'salim4n/dqn-checkpoint-demo',
      process.env.HF_TOKEN!,
      `step-${env.stepCount}`
    );
  }
  
  // Si c'est la fin, sauvegarder un dernier checkpoint
  if (isDone()) {
    console.log(`Training finished at step ${env.stepCount}!`);
    console.log(`Final distance: ${d.toFixed(2)}`);
    await agent.saveCheckpoint(
      'salim4n/dqn-checkpoint-demo',
      process.env.HF_TOKEN!,
      'final'
    );
    env.stop();
    process.exit(0);
  }
};

env.start();
