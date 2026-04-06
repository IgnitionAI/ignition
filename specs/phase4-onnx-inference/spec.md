# Phase 4 — ONNX Inference pour IgnitionAI

## Vision

Après entraînement avec `@ignitionai/backend-tfjs`, l'utilisateur exporte son modèle en format ONNX pour l'inférence en production. ONNX est 2-10x plus rapide que TF.js en inférence, et tourne partout :

- **Browser** : via ONNX Runtime Web (WebGPU ou WASM)
- **Node.js** : via ONNX Runtime Node
- **Python** : via onnxruntime
- **Mobile/C++** : via ONNX Runtime native

## Flow Complet

```
[Entraînement TF.js]           [Export ONNX]              [Inférence ONNX]
DQNAgent.train()           →   exportToOnnx()         →   OnnxAgent.getAction()
    ↓                              ↓                           ↓
model.save('file://...')      Python tf2onnx          onnxruntime-node/web
                           (ou tfjs → SavedModel       charge model.onnx
                            → tf2onnx CLI)              argmax(Q-values)
```

## Détail du Flow d'Export

TF.js → ONNX nécessite une étape Python car il n'existe pas de lib npm fiable pour cette conversion :

1. `DQNAgent` sauvegarde le modèle avec `model.save('file://./my_model')` (JSON + binaire)
2. Conversion Python :
   ```bash
   pip install tensorflowjs tf2onnx
   tensorflowjs_converter --input_format=tfjs_layers_model \
     ./my_model/model.json ./saved_model/
   python -m tf2onnx.convert \
     --saved-model ./saved_model \
     --output ./model.onnx \
     --opset 13
   ```
3. Le fichier `model.onnx` est ensuite chargé par `OnnxAgent`

L'`exporter.ts` dans `backend-onnx` fournit une helper qui orchestre la sauvegarde côté JS et génère le script de conversion Python.

## Interface OnnxAgent

`OnnxAgent` implémente `AgentInterface` en **inference-only** :

```typescript
interface AgentInterface {
  getAction(observation: number[]): Promise<number>;  // ✅ Forward pass ONNX
  remember(experience: Experience): void;              // no-op (pas d'entraînement)
  train(): Promise<void>;                              // no-op (pas d'entraînement)
}
```

Le modèle ONNX est pré-entraîné, `getAction` fait juste un forward pass et retourne `argmax(Q-values)`.

## Config Schema (Zod)

```typescript
const OnnxAgentConfigSchema = z.object({
  modelPath: z.string(),           // Chemin vers le fichier .onnx
  actionSize: z.number().int().positive(),
  executionProviders: z.array(z.string()).default(['cpu']),  // ['webgpu', 'wasm', 'cpu']
  inputName: z.string().default('dense_input'),   // Nom du tensor d'entrée ONNX
  outputName: z.string().default('dense_3'),      // Nom du tensor de sortie ONNX
});
```

## Environnements Supportés

| Environnement | Runtime          | Provider         | Package              |
|---------------|------------------|------------------|----------------------|
| Node.js       | onnxruntime-node | cpu, cuda, dml   | onnxruntime-node     |
| Browser       | onnxruntime-web  | webgpu, wasm     | onnxruntime-web      |
| Auto-detect   | runtime.ts       | détecte l'env    | les deux en peer dep |

## Non-Goals

- Re-implémentation de l'entraînement RL en ONNX (TF.js gère ça)
- Conversion JS native de TF.js → ONNX (nécessite Python, documenté)
- Support de modèles ONNX non-DQN (out of scope pour Phase 4)
