/**
 * Proximal Policy Optimization (PPO-Clip) — Actor-Critic
 *
 * Références :
 *   - "Proximal Policy Optimization Algorithms" (Schulman et al., 2017)
 *   - "High-Dimensional Continuous Control Using GAE" (Schulman et al., 2016)
 *
 * Fonctionnement :
 *   1. Collecter N transitions avec la politique courante (rollout)
 *   2. Calculer les avantages via GAE-λ
 *   3. Faire K epochs de mise à jour en mini-batchs :
 *      - Actor  : minimiser L_CLIP = -E[min(r·A, clip(r,1±ε)·A)] − coef_H·H(π)
 *      - Critic : minimiser L_V = E[(V(s) − R)²]
 *   4. Vider le rollout (algorithme ON-POLICY)
 */

import * as tf from '@tensorflow/tfjs';
import { AgentInterface, Experience, PPOConfig } from '../types';
import { PPOConfigSchema } from '../schemas';

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

/**
 * Entrée du rollout buffer : enrichit Experience avec les métadonnées
 * nécessaires à PPO (log-prob et valeur d'état au moment de la collecte).
 */
interface RolloutEntry extends Experience {
  /** log π_θ_old(a|s) — log-probabilité de l'action sous l'ancienne politique */
  logProb: number;
  /** V(s) — estimation du critic au moment de la collecte */
  value: number;
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/**
 * Echantillonner une action depuis une distribution catégorielle
 * (méthode de la roue roulette / inverse CDF).
 */
function sampleCategorical(probs: number[]): number {
  const u = Math.random();
  let cumsum = 0;
  for (let i = 0; i < probs.length; i++) {
    cumsum += probs[i];
    if (u < cumsum) return i;
  }
  return probs.length - 1; // sécurité numérique
}

/**
 * Construire un MLP avec activations tanh (standard pour les réseaux de politique).
 * La couche de sortie est linéaire ; l'activation finale (softmax / identité)
 * est appliquée à l'extérieur selon le réseau (actor vs critic).
 */
function buildMLP(
  inputSize: number,
  outputSize: number,
  hiddenLayers: number[],
): tf.Sequential {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [inputSize],
      units: hiddenLayers[0],
      activation: 'tanh',
      kernelInitializer: 'glorotUniform',
    }),
  );
  for (let i = 1; i < hiddenLayers.length; i++) {
    model.add(
      tf.layers.dense({
        units: hiddenLayers[i],
        activation: 'tanh',
        kernelInitializer: 'glorotUniform',
      }),
    );
  }
  model.add(
    tf.layers.dense({
      units: outputSize,
      activation: 'linear',
      kernelInitializer: 'glorotUniform',
    }),
  );
  return model;
}

// ---------------------------------------------------------------------------
// Agent PPO
// ---------------------------------------------------------------------------

export class PPOAgent implements AgentInterface {
  /** Réseau acteur : état → logits d'action (avant softmax) */
  private actorNet: tf.Sequential;
  /** Réseau critique : état → valeur scalaire V(s) */
  private criticNet: tf.Sequential;

  private actorOptimizer: tf.Optimizer;
  private criticOptimizer: tf.Optimizer;

  /** Buffer de rollout — vidé après chaque appel à train() */
  private rollout: RolloutEntry[] = [];

  /**
   * Log-probabilité de la dernière action sélectionnée.
   * Rempli dans getAction(), consommé dans remember().
   */
  private lastLogProb = 0;

  /**
   * Valeur d'état estimée par le critic pour le dernier état observé.
   * Rempli dans getAction(), consommé dans remember().
   */
  private lastValue = 0;

  private readonly gamma: number;
  private readonly gaeLambda: number;
  private readonly clipRatio: number;
  private readonly epochs: number;
  private readonly batchSize: number;
  private readonly entropyCoef: number;
  private readonly valueLossCoef: number;
  private readonly actionSize: number;

  constructor(config: PPOConfig) {
    const result = PPOConfigSchema.safeParse(config);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      throw new Error(`[PPOAgent] Invalid config: ${messages}`);
    }
    const {
      inputSize,
      actionSize,
      hiddenLayers = [64, 64],
      lr = 3e-4,
      gamma = 0.99,
      gaeLambda = 0.95,
      clipRatio = 0.2,
      epochs = 4,
      batchSize = 64,
      entropyCoef = 0.01,
      valueLossCoef = 0.5,
    } = config;

    this.actionSize = actionSize;
    this.gamma = gamma;
    this.gaeLambda = gaeLambda;
    this.clipRatio = clipRatio;
    this.epochs = epochs;
    this.batchSize = batchSize;
    this.entropyCoef = entropyCoef;
    this.valueLossCoef = valueLossCoef;

    this.actorNet = buildMLP(inputSize, actionSize, hiddenLayers);
    this.criticNet = buildMLP(inputSize, 1, hiddenLayers);

    this.actorOptimizer = tf.train.adam(lr);
    this.criticOptimizer = tf.train.adam(lr);
  }

  // -------------------------------------------------------------------------
  // Interface AgentInterface
  // -------------------------------------------------------------------------

  /**
   * Sélectionner une action par échantillonnage stochastique depuis π_θ.
   * Stocke lastLogProb et lastValue pour le prochain remember().
   */
  async getAction(state: number[]): Promise<number> {
    const stateTensor = tf.tensor2d([state]);
    try {
      // Passe avant de l'acteur → probabilités d'action
      const logits = this.actorNet.predict(stateTensor) as tf.Tensor2D;
      const probs = tf.softmax(logits);
      const probsData = (probs.arraySync() as number[][])[0];

      // Passe avant du critic → estimation de valeur
      const valueTensor = this.criticNet.predict(stateTensor) as tf.Tensor2D;
      this.lastValue = (valueTensor.arraySync() as number[][])[0][0];

      // Échantillonnage de l'action
      const action = sampleCategorical(probsData);

      // Log-probabilité pour le ratio d'importance lors de l'update
      this.lastLogProb = Math.log(Math.max(probsData[action], 1e-8));

      tf.dispose([logits, probs, valueTensor]);
      return action;
    } finally {
      stateTensor.dispose();
    }
  }

  /**
   * Stocker une transition dans le buffer de rollout.
   * Doit être appelé immédiatement après getAction() pour que
   * lastLogProb et lastValue correspondent bien à cet état.
   */
  remember(experience: Experience): void {
    this.rollout.push({
      ...experience,
      logProb: this.lastLogProb,
      value: this.lastValue,
    });
  }

  /**
   * Mettre à jour l'acteur et le critic sur les données collectées.
   * Vide le buffer de rollout à la fin (algorithme on-policy).
   *
   * Appelé typiquement à la fin de chaque épisode ou après N steps.
   */
  async train(): Promise<void> {
    const n = this.rollout.length;
    if (n === 0) return;

    const { returns, advantages } = this.computeGAE();

    const states = this.rollout.map(e => e.state);
    const actions = this.rollout.map(e => e.action as number);
    const oldLogProbs = this.rollout.map(e => e.logProb);

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      // Mélanger les indices pour des mini-batchs non biaisés
      const indices = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      for (let start = 0; start < n; start += this.batchSize) {
        const mb = indices.slice(start, start + this.batchSize);
        if (mb.length === 0) continue;

        await this.updateMinibatch(
          mb.map(i => states[i]),
          mb.map(i => actions[i]),
          mb.map(i => oldLogProbs[i]),
          mb.map(i => advantages[i]),
          mb.map(i => returns[i]),
        );
      }
    }

    // Vider le rollout — PPO est on-policy
    this.rollout = [];
  }

  // -------------------------------------------------------------------------
  // Calcul des avantages
  // -------------------------------------------------------------------------

  /**
   * Generalized Advantage Estimation (GAE-λ).
   *
   * Compromis biais/variance contrôlé par λ :
   *   λ = 0 → TD(0) (faible variance, fort biais)
   *   λ = 1 → Monte-Carlo (forte variance, faible biais)
   *
   * Formule :
   *   δ_t = r_t + γ·V(s_{t+1})·(1−done) − V(s_t)
   *   A_t = δ_t + (γλ)·A_{t+1}
   *   R_t = A_t + V(s_t)   ← cible pour le critic
   *
   * Les avantages sont normalisés (μ=0, σ=1) pour la stabilité.
   */
  private computeGAE(): { returns: number[]; advantages: number[] } {
    const n = this.rollout.length;
    const advantages = new Array<number>(n);
    const returns = new Array<number>(n);

    let nextValue = 0; // V(s_{T+1}) = 0 pour l'état terminal
    let lastGAE = 0;

    for (let t = n - 1; t >= 0; t--) {
      const { reward, terminated, truncated, value } = this.rollout[t];
      const mask = (terminated || truncated) ? 0 : 1;

      // Erreur TD
      const delta = reward + this.gamma * nextValue * mask - value;
      // Accumulation GAE
      lastGAE = delta + this.gamma * this.gaeLambda * mask * lastGAE;

      advantages[t] = lastGAE;
      returns[t] = lastGAE + value;
      nextValue = value;
    }

    // Normalisation des avantages
    const mean = advantages.reduce((s, a) => s + a, 0) / n;
    const std =
      Math.sqrt(advantages.reduce((s, a) => s + (a - mean) ** 2, 0) / n) +
      1e-8;

    return {
      returns,
      advantages: advantages.map(a => (a - mean) / std),
    };
  }

  // -------------------------------------------------------------------------
  // Mise à jour des réseaux
  // -------------------------------------------------------------------------

  /**
   * Un pas de gradient sur acteur + critic pour un mini-batch.
   *
   * Acteur — L_CLIP(θ) :
   *   r_t(θ) = π_θ(a_t|s_t) / π_θ_old(a_t|s_t)
   *   L = −E[min(r·A, clip(r, 1±ε)·A)] − coef_H · H(π)
   *
   * Critic — L_V(φ) :
   *   L = coef_V · E[(V_φ(s) − R)²]
   */
  private async updateMinibatch(
    states: number[][],
    actions: number[],
    oldLogProbs: number[],
    advantages: number[],
    returns: number[],
  ): Promise<void> {
    // Tenseurs d'entrée (créés hors des closures pour survivre aux deux updates)
    const statesTensor = tf.tensor2d(states);
    const actionsTensor = tf.tensor1d(actions, 'int32');
    const oldLogProbsTensor = tf.tensor1d(oldLogProbs);
    const advantagesTensor = tf.tensor1d(advantages);
    const returnsTensor = tf.tensor1d(returns);

    // Variables entraînables — passées explicitement pour cibler le bon réseau
    const actorVars = this.actorNet.trainableWeights.map(
      w => (w as unknown as { val: tf.Variable }).val,
    );
    const criticVars = this.criticNet.trainableWeights.map(
      w => (w as unknown as { val: tf.Variable }).val,
    );

    try {
      // --- Mise à jour de l'acteur ---
      // tf.tidy nettoie les tenseurs intermédiaires après le calcul des gradients
      tf.tidy(() => {
        this.actorOptimizer.minimize(
          () => {
            const logits = this.actorNet.apply(statesTensor, {
              training: true,
            }) as tf.Tensor2D;
            const probs = tf.softmax(logits);
            const logProbsAll = tf.log(tf.add(probs, 1e-8));

            // Sélectionner log π(a|s) pour chaque action via encodage one-hot
            const oneHot = tf.oneHot(actionsTensor, this.actionSize).cast('float32');
            const newLogProbs = tf.sum(tf.mul(logProbsAll, oneHot), 1);

            // Ratio d'importance : r = π_new(a|s) / π_old(a|s)
            const ratio = tf.exp(tf.sub(newLogProbs, oldLogProbsTensor));

            // Objectif surrogate clipé (PPO-Clip)
            const surr1 = tf.mul(ratio, advantagesTensor);
            const surr2 = tf.mul(
              tf.clipByValue(ratio, 1 - this.clipRatio, 1 + this.clipRatio),
              advantagesTensor,
            );
            const ppoLoss = tf.neg(tf.mean(tf.minimum(surr1, surr2)));

            // Bonus d'entropie H(π) = −Σ π(a|s) log π(a|s)
            const entropy = tf.neg(
              tf.mean(tf.sum(tf.mul(probs, logProbsAll), 1)),
            );

            return tf.sub(
              ppoLoss,
              tf.mul(tf.scalar(this.entropyCoef), entropy),
            ) as tf.Scalar;
          },
          false,
          actorVars,
        );
      });

      // --- Mise à jour du critic ---
      tf.tidy(() => {
        this.criticOptimizer.minimize(
          () => {
            const values = this.criticNet.apply(statesTensor, {
              training: true,
            }) as tf.Tensor2D;
            const valuesSqueezed = values.squeeze([1]) as tf.Tensor1D;
            const valueLoss = tf.losses.meanSquaredError(
              returnsTensor,
              valuesSqueezed,
            );
            return tf.mul(
              tf.scalar(this.valueLossCoef),
              valueLoss,
            ) as tf.Scalar;
          },
          false,
          criticVars,
        );
      });
    } finally {
      tf.dispose([
        statesTensor,
        actionsTensor,
        oldLogProbsTensor,
        advantagesTensor,
        returnsTensor,
      ]);
    }
  }

  // -------------------------------------------------------------------------
  // Utilitaires
  // -------------------------------------------------------------------------

  dispose(): void {
    this.actorNet?.dispose();
    this.criticNet?.dispose();
    this.rollout = [];
  }
}
