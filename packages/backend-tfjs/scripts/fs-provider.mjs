import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as tf from '@tensorflow/tfjs';

function idToDir(root, modelId) {
  return join(root, ...String(modelId).split('/').filter(Boolean));
}

export function fileSystemModelProvider(root) {
  return {
    async save(modelId, model, metadata) {
      const dir = idToDir(root, modelId);
      mkdirSync(dir, { recursive: true });
      await model.save(
        tf.io.withSaveHandler(async (artifacts) => {
          const weightData = artifacts.weightData;
          if (!weightData || Array.isArray(weightData)) {
            throw new Error('[fs-provider] expected a single ArrayBuffer of weights');
          }
          writeFileSync(
            join(dir, 'model.json'),
            JSON.stringify({
              modelTopology: artifacts.modelTopology,
              format: artifacts.format,
              generatedBy: artifacts.generatedBy,
              convertedBy: artifacts.convertedBy,
              weightsManifest: [{ paths: ['weights.bin'], weights: artifacts.weightSpecs }],
              metadata: metadata ?? {},
            }),
          );
          writeFileSync(join(dir, 'weights.bin'), Buffer.from(weightData));
          return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
        }),
      );
      return `file://${dir}`;
    },
    async load(modelId) {
      const dir = idToDir(root, modelId);
      const raw = JSON.parse(readFileSync(join(dir, 'model.json'), 'utf8'));
      const bin = readFileSync(join(dir, 'weights.bin'));
      return tf.loadLayersModel(
        tf.io.fromMemory({
          modelTopology: raw.modelTopology,
          format: raw.format,
          generatedBy: raw.generatedBy,
          convertedBy: raw.convertedBy,
          weightSpecs: raw.weightsManifest[0].weights,
          weightData: bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength),
        }),
      );
    },
    async list() {
      if (!existsSync(root)) return [];
      return readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({ modelId: entry.name, uri: `file://${join(root, entry.name)}` }));
    },
    async delete() {},
    async exists(modelId) {
      return existsSync(join(idToDir(root, modelId), 'model.json'));
    },
  };
}
