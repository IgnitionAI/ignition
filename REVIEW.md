# Review Guide — IgnitionAI Core Refacto

## Vue d'ensemble

Refactorisation complète du framework IgnitionAI (deep reinforcement learning en TF.js pour le navigateur). Le travail est organisé en 4 phases, chacune sur sa propre branche.

## Branches à review (dans l'ordre de merge)

### 1. `feature/core-refacto` ← MERGER EN PREMIER
**Phase 1 + 2 : Algos RL + Environnements**

Commits :
- Refacto core types : ObservationSpace, ActionSpace (Discrete/Box), StepResult avec terminated/truncated, AgentInterface avec dispose/reset, CheckpointableAgent
- Déduplication Experience (backend-tfjs importe depuis @ignitionai/core)
- Fix DQN : dispose tensor argMax (memory leak), test de convergence navigation 1D
- PPO complet : Actor-Critic, GAE-λ, clipped surrogate objective, bonus entropie, mini-batch shuffled. 424 lignes. Test convergence.
- QTable : Q-Learning tabulaire, discrétisation mixed-radix, update Bellman online. Test convergence GridWorld 5x5.
- Schémas Zod : validation runtime de toutes les configs (DQN, PPO, QTable, IgnitionEnvConfig). Types dérivés via z.infer<>.
- Fix zod dependency dans backend-tfjs
- Environnements de référence (packages/environments/) : GridWorld NxN, CartPole (physique Euler), MountainCar. 31 tests.
- Tests d'intégration end-to-end : DQN+GridWorld, QTable+GridWorld, PPO+CartPole
- Fix start() : setInterval remplacé par boucle async, flag isRunning, plus d'accumulation de steps

Aussi vérifier si `claude/romantic-nobel` (backend selector TF.js) doit être mergé dans cette branche avant review.

### 2. `feature/phase3-model-persistence` ← MERGER APRÈS core-refacto
**Phase 3 : Persistance modèle**

Nouveau package @ignitionai/storage :
- Interface ModelStorageProvider (save/load/list/delete/exists)
- Provider Hugging Face Hub complet
- Config via HF_TOKEN + HF_REPO_ID, validée par Zod
- Intégration DQNAgent avec saveModel()/loadModel()
- 19 tests mockés

Specs dans specs/phase3-model-persistence/ (spec.md, plan.md, tasks.md)

### 3. `feature/phase4-onnx-inference` ← MERGER EN DERNIER
**Phase 4 : Inférence ONNX**

Nouveau package @ignitionai/backend-onnx :
- Runtime wrapper ONNX (onnxruntime-node/web, auto-detect)
- OnnxAgent : agent inference-only, implémente AgentInterface. getAction() fait un forward pass ONNX.
- Exporter TF.js → ONNX : saveForOnnxExport() + génère script Python tf2onnx
- HF Hub loader : télécharge .onnx depuis Hugging Face avec retry
- Tests mockés

Specs dans specs/phase4-onnx-inference/ (spec.md, plan.md, tasks.md)

## Branches secondaires (doublons/cleanup)

Ces branches contiennent du travail intermédiaire qui est déjà inclus dans les branches principales :
- `claude/distracted-kirch` — Zod validation (doublon de feature/core-refacto)
- `claude/pedantic-diffie` — QTable/PPO/DQN (doublon de feature/core-refacto)
- `claude/sharp-kepler` — Fix zod deps (cherry-pické dans feature/core-refacto)
- `claude/crazy-napier` — Phase 2 environments (inclus dans feature/core-refacto)
- `claude/romantic-nobel` — Backend selector TF.js (à merger dans feature/core-refacto si pas encore fait)

→ Ces branches peuvent être supprimées après merge des branches principales.

## Ordre de merge recommandé

```
main ← feature/core-refacto ← feature/phase3-model-persistence ← feature/phase4-onnx-inference
```

Chaque branche dépend de la précédente. Merger dans cet ordre.

## Architecture finale après merge

```
packages/
├── core/           — IgnitionEnv, types, interfaces, schémas Zod
├── backend-tfjs/   — DQN, PPO, QTable (entraînement TF.js)
├── backend-onnx/   — OnnxAgent (inférence ONNX)
├── environments/   — GridWorld, CartPole, MountainCar
└── storage/        — ModelStorageProvider, HuggingFace provider
```

## Flow utilisateur

```
1. Train : import { DQNAgent } from '@ignitionai/backend-tfjs'
2. Environnement : import { createGridWorld } from '@ignitionai/environments'
3. Save : agent.saveModel('my-model') via @ignitionai/storage (HF Hub)
4. Export ONNX : saveForOnnxExport(model) + script Python tf2onnx
5. Inference : import { OnnxAgent } from '@ignitionai/backend-onnx'
```

## Tests

| Package | Tests | Status |
|---------|-------|--------|
| core | 10+ (IgnitionEnv, schemas) | ✅ |
| backend-tfjs | DQN convergence, PPO convergence, QTable convergence, schemas (44+) | ✅ |
| environments | GridWorld, CartPole, MountainCar (31) | ✅ |
| storage | HuggingFace provider (19) | ✅ |
| backend-onnx | Runtime, OnnxAgent, exporter (mockés) | ✅ |

2 tests pré-existants échouent (tfjs-node native addon non compilé) — hors scope.
