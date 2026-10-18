# Spec — @ignitionai/viz : interface standard de visualisation

Issue : [#74](https://github.com/IgnitionAI/ignition/issues/74)

## Problème

Chaque démo réinvente l'affichage des métriques (`demo-target-chasing` : `trainingStore` +
`TrainingControls.tsx` ; `ignition-web-rl` : UI propre). Aucune couche partagée.

## Solution

Nouveau package `packages/viz` (`@ignitionai/viz`) : composants React + store de métriques,
consommables par n'importe quelle démo.

### API

```ts
// Store (factory zustand, indépendant des démos)
const useMetrics = createMetricsStore({ maxFrames?: number, successWindow?: number }); // défauts 500 / 100
useMetrics.getState().pushTrainingFrame(frame);
useMetrics.getState().pushInferenceFrame(frame);
useMetrics.getState().reset();

// Composants
<MetricsDashboard store={useMetrics} />   // bascule training ↔ inference
<TrainingDashboard store={useMetrics} />  // reward/épisode, loss, epsilon, succès glissant
<InferenceDashboard store={useMetrics} /> // steps, action, Q-values, réussite
```

### Types

```ts
interface TrainingFrame {
  episode: number;
  reward: number;
  steps: number;
  loss?: number;
  epsilon?: number;
  success: boolean;
}

interface InferenceFrame {
  step: number;
  action: number;
  qValues?: number[];
  reward?: number;
  done?: boolean;
  success?: boolean;
}
```

Le consommateur pousse ce qu'il a : `loss`/`epsilon`/`qValues` sont optionnels car tous les
agents ne les exposent pas (Q-Table n'a pas de loss, PPO a value/policy loss).

## Choix

- **Recharts** pour les courbes (standard React, zéro config).
- **Zustand** pour le store (déjà la convention des démos).
- Taux de succès glissant sur les 100 derniers épisodes, calculé dans le store.
- Cap de 500 frames par défaut pour borner la mémoire en training long.

## Hors scope

- Comparatif de runs, leaderboard, challenges (#74 : « pas de challenge »).
- Persistance des métriques.
- Intégration dans une démo précise (issue séparée).
