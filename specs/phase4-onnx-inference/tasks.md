# Tasks — Phase 4 ONNX Inference

## Ordre d'Implémentation

### T1 — Squelette du package
- [ ] Mettre à jour `packages/backend-onnx/package.json` : deps, scripts, types
- [ ] Mettre à jour `packages/backend-onnx/tsconfig.json` : hériter de base, inclure src
- [ ] Créer `packages/backend-onnx/src/types.ts` : OnnxAgentConfig + schéma Zod
- Un commit

### T2 — ONNX Runtime wrapper
- [ ] Créer `packages/backend-onnx/src/runtime.ts`
  - createOnnxSession() : charge .onnx avec onnxruntime-node
  - runInference() : Float32Array → Float32Array
  - dispose() : libère session
- Un commit

### T3 — OnnxAgent (inference-only)
- [ ] Créer `packages/backend-onnx/src/agents/onnx-agent.ts`
  - Implémente AgentInterface
  - load() : appelle createOnnxSession
  - getAction() : runInference + argmax
  - remember() et train() : no-ops
  - dispose()
- Un commit

### T4 — Exporter TF.js → ONNX
- [ ] Créer `packages/backend-onnx/src/exporter.ts`
  - saveForOnnxExport() : sauvegarde modèle TF.js via model.save()
  - generateConversionScript() : génère script shell Python
  - Documenter les étapes dans les JSDoc
- Un commit

### T5 — Tests
- [ ] Créer `packages/backend-onnx/src/tests/onnx-agent.test.ts`
  - Créer un modèle ONNX minimal avec onnxruntime-node (ou un fixture .onnx)
  - Tester getAction() retourne un entier valide
  - Tester que remember() et train() ne throw pas
- [ ] Créer `packages/backend-onnx/src/tests/runtime.test.ts`
  - Tester createOnnxSession avec un modèle valide
  - Tester runInference retourne Float32Array de bonne dimension
- `pnpm test` doit passer
- Un commit

### T6 — Intégration HF Hub
- [ ] Créer `packages/backend-onnx/src/io/loadOnnxFromHub.ts`
  - Télécharge le fichier .onnx depuis HF Hub via @huggingface/hub
  - Retourne Buffer pour usage avec onnxruntime-node
- [ ] Ajouter méthode `loadFromHub()` sur OnnxAgent
- Un commit

### T7 — Exports publics
- [ ] Mettre à jour `packages/backend-onnx/src/index.ts`
  - Export OnnxAgent, OnnxAgentConfig, OnnxAgentConfigSchema
  - Export saveForOnnxExport, generateConversionScript
  - Export loadOnnxModelFromHub
- [ ] Supprimer `packages/backend-onnx/index.ts` (root stub obsolète)
- `pnpm build` doit passer
- Un commit

## Critères de Succès

- `pnpm test` : tous les tests passent
- `pnpm build` : compilation TypeScript sans erreur
- `OnnxAgent` charge un .onnx et retourne des actions cohérentes (entiers dans [0, actionSize))
- L'exporter génère un script Python valide et documenté
- Les types TypeScript sont correctement exportés
