import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { uploadFiles, createRepo } from '@huggingface/hub';
import { loadModelFromHub } from './loadModel';

// Classe File polyfill pour Node.js
class NodeFile {
  name: string;
  content: Buffer;
  
  constructor(content: Buffer, name: string) {
    this.content = content;
    this.name = name;
  }
}

/**
 * Save a TensorFlow.js model locally and push it to Hugging Face Hub.
 *
 * @param model Trained tf.LayersModel
 * @param repo Full Hugging Face repo ID (e.g. "salim4n/dqn-agent")
 * @param token Hugging Face access token
 * @param subdir Subfolder inside repo (e.g. "step-5" or "best")
 */
export async function saveModelToHub(
  model: tf.LayersModel,
  repo: string,
  token: string,
  subdir: string = 'model'
): Promise<void> {
  const tmpDir = path.resolve(`./tmp-model/${subdir}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // Sauvegarde directe des fichiers sans utiliser model.save()
  const modelJSON = model.toJSON();
  const weights = model.getWeights();
  
  // Sauvegarder model.json
  fs.writeFileSync(
    path.join(tmpDir, 'model.json'),
    JSON.stringify(modelJSON, null, 2)
  );

  // Sauvegarder weights.bin
  const weightData = new Float32Array(weights.reduce((acc, w) => acc + w.size, 0));
  let offset = 0;
  weights.forEach(w => {
    const data = w.dataSync();
    weightData.set(data, offset);
    offset += data.length;
  });
  fs.writeFileSync(path.join(tmpDir, 'weights.bin'), Buffer.from(weightData.buffer));

  // Création des objets pour Hugging Face Upload
  const files = [
    { 
      path: `${subdir}/model.json`,
      content: new Blob([fs.readFileSync(path.join(tmpDir, 'model.json'))])
    },
    { 
      path: `${subdir}/weights.bin`,
      content: new Blob([fs.readFileSync(path.join(tmpDir, 'weights.bin'))])
    }
  ];

  // Ajouter README
  const readmeContent = `# TensorFlow.js Model

## Model Information
- Framework: TensorFlow.js
- Type: Deep Q-Network (DQN)
- Created by: IgnitionAI

## Model Format
This model is saved in TensorFlow.js format and can be loaded in two ways:

1. **LayersModel** (Default)
   - Better for fine-tuning and training
   - More flexible for model modifications
   - Higher memory usage
   - Slower inference

2. **GraphModel**
   - Optimized for inference only
   - Faster execution
   - Lower memory usage
   - Not suitable for training

## Usage
\`\`\`javascript
import { loadModelFromHub } from '@ignitionai/backend-tfjs';

// Option 1: Load as LayersModel (for training/fine-tuning)
const layersModel = await loadModelFromHub(
  '${repo}',
  '${subdir}/model.json',
  false // graphModel = false for LayersModel
);

// Option 2: Load as GraphModel (for inference only)
const graphModel = await loadModelFromHub(
  '${repo}',
  '${subdir}/model.json',
  true // graphModel = true for GraphModel
);

// Run inference
const input = tf.tensor2d([[0.1, 0.2]]);
const output = model.predict(input);
\`\`\`

## Features
- Automatic retry with exponential backoff
- Configurable retry attempts and delays
- Error handling and logging
- Support for both LayersModel and GraphModel

## Files
- \`model.json\`: Model architecture and configuration
- \`weights.bin\`: Model weights
- \`README.md\`: This documentation

## Repository
This model was uploaded via the IgnitionAI TensorFlow.js integration.
`;

  // Ajouter README si c'est le dossier racine du modèle
  if (subdir === 'model') {
    files.push({
      path: 'README.md',
      content: new Blob([readmeContent])
    });
  }

  // Création du repo si nécessaire
  try {
    await createRepo({ repo, accessToken: token });
    console.log(`[HFHub] Repo "${repo}" ready.`);
  } catch (err) {
    console.warn(`[HFHub] Repo already exists or failed to create:`, (err as any)?.message);
  }

  // Upload vers Hugging Face
  await uploadFiles({
    repo,
    accessToken: token,
    files
  });

  console.log(`[HFHub] ✅ Uploaded to https://huggingface.co/${repo}/tree/main/${subdir}`);
}
