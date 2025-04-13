import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { uploadFiles, createRepo } from '@huggingface/hub';

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

  const savePath = `file://${tmpDir}`;
  console.log(`[HFHub] Saving model to: ${savePath}`);
  await model.save(savePath);

  // Lecture des fichiers
  const modelPath = path.join(tmpDir, 'model.json');
  const weightsPath = path.join(tmpDir, 'weights.bin');

  const modelJSON = fs.readFileSync(modelPath);
  const weightsBIN = fs.readFileSync(weightsPath);

  // Création des objets pour Hugging Face Upload
  const files = [
    { 
      path: `${subdir}/model.json`,
      content: new Blob([modelJSON])
    },
    { 
      path: `${subdir}/weights.bin`,
      content: new Blob([weightsBIN])
    }
  ];

  // Ajouter README
  const readmeContent = `# TensorFlow.js Model

## Model Information
- Framework: TensorFlow.js
- Type: Deep Q-Network (DQN)
- Created by: IgnitionAI

## Usage
\`\`\`javascript
// Load the model
import * as tf from '@tensorflow/tfjs';
const model = await tf.loadLayersModel('https://huggingface.co/${repo}/resolve/main/${subdir}/model.json');

// Run inference
const input = tf.tensor2d([[0.1, 0.2]]);
const output = model.predict(input);
\`\`\`
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
