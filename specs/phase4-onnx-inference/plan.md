# Plan — Phase 4 ONNX Inference

## Architecture du Package `@ignitionai/backend-onnx`

```
packages/backend-onnx/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Exports publics
    ├── types.ts              # OnnxAgentConfig + schéma Zod
    ├── runtime.ts            # Abstraction ONNX Runtime (node vs web)
    ├── agents/
    │   └── onnx-agent.ts    # OnnxAgent : AgentInterface inference-only
    ├── exporter.ts           # Helper export TF.js → ONNX (génère script Python)
    ├── io/
    │   └── loadOnnxFromHub.ts  # Chargement .onnx depuis HF Hub
    └── tests/
        ├── onnx-agent.test.ts  # Tests inference avec un modèle ONNX minimal
        └── runtime.test.ts     # Tests du runtime wrapper
```

## Dépendances

### Runtime (dans package.json `dependencies`)
```json
{
  "onnxruntime-node": "^1.17.0",
  "zod": "^3.22.0",
  "@huggingface/hub": "^1.1.2"
}
```

### Peer Dependencies (optionnelles)
```json
{
  "onnxruntime-web": "^1.17.0"
}
```

### Dev Dependencies
```json
{
  "vitest": "^3.1.1",
  "@tensorflow/tfjs-node": "^4.22.0"  // pour créer des modèles de test
}
```

## Module par Module

### `types.ts`
- `OnnxAgentConfig` : type TypeScript déduit du schéma Zod
- `OnnxAgentConfigSchema` : validation Zod de la config
- Re-export de `AgentInterface` et `Experience` depuis `@ignitionai/core`

### `runtime.ts`
- `createOnnxSession(modelPath: string, providers: string[])` : crée une `InferenceSession`
- `runInference(session, inputData: Float32Array, inputShape: number[])` : retourne Float32Array
- Auto-détecte l'environnement (Node.js via `process` object, sinon web)
- En Node : importe `onnxruntime-node`
- En web : importe `onnxruntime-web`

### `agents/onnx-agent.ts`
```typescript
class OnnxAgent implements AgentInterface {
  private session: InferenceSession | null = null;

  constructor(config: OnnxAgentConfig) {}

  async load(): Promise<void>          // Charge le fichier .onnx
  async getAction(obs: number[]): Promise<number>  // Forward pass + argmax
  remember(_: Experience): void        // no-op
  async train(): Promise<void>         // no-op
  dispose(): void                      // Libère la session ONNX
}
```

### `exporter.ts`
```typescript
// Sauvegarde le modèle TF.js en format JSON/bin
async function saveForOnnxExport(
  model: tf.LayersModel,
  outputDir: string
): Promise<{ modelDir: string; conversionScript: string }>

// Génère un script shell Python pour la conversion
function generateConversionScript(modelDir: string, outputPath: string): string
```

### `io/loadOnnxFromHub.ts`
```typescript
// Télécharge un fichier .onnx depuis un repo HF Hub
async function loadOnnxModelFromHub(
  repoId: string,
  filename: string  // ex: "model.onnx"
): Promise<Buffer>  // ou Uint8Array pour browser
```

## Décisions Architecturales

### Pourquoi pas de conversion JS native ?
Aucun package npm maintenu ne fait TF.js → ONNX de façon fiable. La chaîne Python (`tensorflowjs_converter` + `tf2onnx`) est la voie officielle recommandée par TensorFlow.

### Pourquoi `onnxruntime-node` et pas `onnxruntime-web` par défaut ?
Le contexte principal de ce monorepo est Node.js (scripts d'entraînement, tests Vitest). `onnxruntime-web` est peer dependency pour les use cases browser.

### Gestion des noms de tenseurs ONNX
Les noms de tenseurs d'entrée/sortie varient selon le modèle exporté. La config expose `inputName` et `outputName` configurables, avec des valeurs par défaut basées sur le modèle DQN standard (couches `dense_input` → `dense_3`).
