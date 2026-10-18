# Plan d'exécution — interface standard de visualisation (#74 + #75)

Baseline git : `323fa68` (= dev, branche feat/74-viz-interface sans commit propre au départ).
Mode : autonome (owner : « pilote jusqu'au bout sans moi »).

## Constats d'analyse (preuves à la baseline)

- `packages/viz` existe, non commité : store Zustand factory + `TrainingDashboard` / `InferenceDashboard` / `MetricsDashboard` / `StatCard` + 3 tests vitest. **Build et tests verts** (`pnpm --filter @ignitionai/viz build` ✓, 3/3 tests ✓).
- **Baseline dev cassée (pré-existant, hors scope)** : `packages/core` ne compile pas (`ignition-env.ts`, séquelles du merge Phase 3 persistance) et la suite racine est rouge (20 failed / 86 passed). Reproduit sur un worktree `dev` propre.
- `packages/demo-target-chasing` build ✓ (consomme le `dist` de core, pas ses sources).

## Décisions

1. **#74 livré tel quel** : le code existant satisfait déjà tous les critères de la spec — aucun code de production à écrire sur le package, on commit et on prouve.
2. **Critère « pnpm build et pnpm test verts » scopé** à `packages/viz` + absence de régression vs baseline : la cassure core est pré-existante, autre sous-système (Ingénieur RL / debug), signalée au bilan. Corriger core dans cette mission serait du scope creep non autorisé.
3. **Intégration démo = issue séparée #75** (la spec #74 l'exige : « issue séparée »), branche `feat/75-demo-viz-integration` basée sur `feat/74-viz-interface`, PR empilée. Une issue → une PR (règle du dépôt).
4. **Pas de visualisation RNN/3D** : hors scope (nos agents sont des MLP ; chantier séparé à cadrer, territoire Web 3D).
5. Le dashboard standard **s'ajoute** à `TrainingControls` existant (difficulté, temps, boutons conservés).

## Exécution

| Étape | Qui | Contenu |
|---|---|---|
| IMPLEMENT a | orchestrateur | Commit `packages/viz` sur feat/74-viz-interface |
| IMPLEMENT b | Expert Frontend | Intégration #75 : fichiers `packages/demo-target-chasing/**` uniquement + `package.json` (dep workspace:*) |
| CODE-REVIEW | 2× Expert Revue (read-only, parallèle) | Axe Standards + axe Spec sur le diff complet baseline→head |
| VERIFY | Expert Frontend (sans modification) | Builds, tests, rendu navigateur réel avec captures |

## Critères d'acceptation

- #74 : spec.md § Critères — package buildable ✓, dashboards ✓, store injectable ✓, tests store ✓, build/test du package verts ✓ (critère workspace scopé, cf. décision 2).
- #75 : cf. corps de l'issue — build démo vert, dashboard alimenté par un entraînement réel, preuve navigateur, zéro régression.

## Clôture

PR avec `Closes #74` / `Closes #75` (fermeture au merge par l'owner — pas de merge agent sans demande explicite). Issues préexistantes jamais fermées implicitement.
