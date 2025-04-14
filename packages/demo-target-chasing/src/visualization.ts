import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DQNAgent } from '@ignitionai/backend-tfjs';
import { IgnitionEnv } from '@ignitionai/core';

// Configuration de la scène Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ajouter des contrôles de caméra
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Créer une grille pour mieux visualiser l'espace
const gridHelper = new THREE.GridHelper(50, 50);
scene.add(gridHelper);

// Créer l'agent (sphère bleue)
const agentGeometry = new THREE.SphereGeometry(0.2, 32, 32);
const agentMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const agent = new THREE.Mesh(agentGeometry, agentMaterial);
scene.add(agent);

// Créer la cible (sphère rouge)
const targetGeometry = new THREE.SphereGeometry(0.2, 32, 32);
const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const target = new THREE.Mesh(targetGeometry, targetMaterial);
scene.add(target);

// Positionner la caméra
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Variables pour l'environnement
let position = 0;
let targetPosition = (Math.random() - 0.5) * 4;
let bestDistance = Infinity;
let stepCount = 0;
let previousDistance = Infinity;

// Créer l'agent DQN
const dqnAgent = new DQNAgent({
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

// Vérifier si le token est disponible
const hfToken = import.meta.env?.VITE_HF_TOKEN;
if (!hfToken) {
  console.warn('⚠️ VITE_HF_TOKEN non trouvé. Les checkpoints ne seront pas sauvegardés.');
}

// Créer l'environnement
const env: IgnitionEnv = new IgnitionEnv({
  agent: dqnAgent,
  getObservation: () => [position, targetPosition],
  applyAction: (a: number) => {
    const dx = a - 1;
    position += dx * 0.2;
    agent.position.x = position;
    
    // Log de l'action
    console.log(`[ACTION] ${a} (dx: ${dx.toFixed(2)})`);
  },
  computeReward: () => {
    const d = Math.abs(position - targetPosition);
    
    // Vérifier si l'agent s'éloigne
    const isMovingAway = d > previousDistance;
    previousDistance = d;
    
    // Récompense de base
    let reward = 1.0 / (1.0 + d);
    
    // Pénalité si s'éloigne
    if (isMovingAway) {
      reward -= 0.5;
    }
    
    // Bonus si proche
    if (d < 0.5) {
      reward += 1.0;
    }
    
    return reward;
  },
  isDone: (): boolean => {
    const d = Math.abs(position - targetPosition);
    const done = d < 0.1 || stepCount > 1000;
    
    if (done) {
      console.log(`[DONE] Distance finale: ${d.toFixed(2)}`);
    }
    
    return done;
  },
  onReset: () => {
    position = 0;
    targetPosition = (Math.random() - 0.5) * 4;
    agent.position.x = position;
    target.position.x = targetPosition;
    stepCount = 0;
    bestDistance = Infinity;
    previousDistance = Math.abs(position - targetPosition);
    
    // Log du reset
    console.log(`[RESET] Nouvelle cible: ${targetPosition.toFixed(2)}`);
  },
  stepIntervalMs: 100,
  hfRepoId: 'salim4n/dqn-checkpoint-threejs',
  hfToken: hfToken || '',
});

// Étendre la méthode step pour gérer les checkpoints
const originalStep = env.step.bind(env);
env.step = async (action?: number) => {
  // Attendre que l'étape précédente soit terminée
  const result = await originalStep();
  stepCount++;
  
  const d = Math.abs(position - targetPosition);
  
  // Log de l'étape
  if (stepCount % 10 === 0) {
    console.log(`[STEP ${stepCount}] Position: ${position.toFixed(2)}, Cible: ${targetPosition.toFixed(2)}, Distance: ${d.toFixed(2)}`);
  }
  
  // Sauvegarder un checkpoint si c'est la meilleure performance jusqu'à présent
  if (d < bestDistance) {
    bestDistance = d;
    console.log(`[CHECKPOINT] Nouvelle meilleure distance: ${d.toFixed(4)}`);
    console.log(`[CHECKPOINT] Sauvegarde du meilleur modèle...`);
    // Désactiver la sauvegarde dans le navigateur
    // await dqnAgent.saveCheckpoint(
    //   'salim4n/dqn-checkpoint-threejs',
    //   hfToken || '',
    //   'best'
    // );
    console.log(`[CHECKPOINT] ✅ Meilleur modèle sauvegardé (simulé)`);
  }
  
  // Sauvegarder un checkpoint tous les 100 steps
  if (stepCount % 100 === 0) {
    console.log(`[CHECKPOINT] Sauvegarde régulière à l'étape ${stepCount}`);
    // Désactiver la sauvegarde dans le navigateur
    // await dqnAgent.saveCheckpoint(
    //   'salim4n/dqn-checkpoint-threejs',
    //   hfToken || '',
    //   `step-${stepCount}`
    // );
  }
  
  // Si c'est la fin, sauvegarder un dernier checkpoint
  const isDone = (): boolean => {
    const d = Math.abs(position - targetPosition);
    return d < 0.1 || stepCount > 1000;
  };
  
  if (isDone()) {
    console.log(`[FINISH] Entraînement terminé à l'étape ${stepCount}!`);
    console.log(`[FINISH] Distance finale: ${d.toFixed(2)}`);
    // Désactiver la sauvegarde dans le navigateur
    // await dqnAgent.saveCheckpoint(
    //   'salim4n/dqn-checkpoint-threejs',
    //   hfToken || '',
    //   'final'
    // );
    env.stop();
  }
  
  return result;
};

// Fonction d'animation
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Gérer le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Démarrer l'animation et l'environnement
console.log('[START] Démarrage de la visualisation...');
animate();
env.start(); 