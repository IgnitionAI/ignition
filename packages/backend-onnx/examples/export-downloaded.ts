import '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { saveForOnnxExport } from '@ignitionai/backend-onnx';

async function main(): Promise<void> {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: export-downloaded <path/to/ignition-dqn.json> [output-directory]');
  const model = await tf.loadLayersModel(pathToFileURL(resolve(input)).href);
  try {
    const { modelDir, conversionScript } = await saveForOnnxExport(model, process.argv[3] ?? './export');
    await writeFile(resolve(modelDir, 'convert.sh'), conversionScript);
    process.stdout.write(`TF.js files and convert.sh saved in ${modelDir}\n`);
  } finally { model.dispose(); }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
