import { afterAll, describe, expect, it } from 'vitest';
import { OnnxAgent } from '@ignitionai/backend-onnx';
import {
  EXPORT_MEASUREMENT,
  collectGreedyTfjsPolicy,
  conversionScriptFor,
  declareExportBudget,
  disposeTfjsVariables,
  probePythonConversion,
  probeTfjsNodeFileHandler,
  trySaveAndConvert,
  compareOnnxToTfjs,
} from './skill-export-onnx';

const budgetText = declareExportBudget();
process.stdout.write(`${budgetText}\n`);

const pythonProbe = probePythonConversion();
const tfjsNodeProbe = probeTfjsNodeFileHandler();
const conversionReady = pythonProbe.available && tfjsNodeProbe.available;
process.stdout.write(
  `CONVERSION_PROBES ${JSON.stringify({ pythonProbe, tfjsNodeProbe, conversionReady })}\n`,
);
const conversionSkipReason = [
  pythonProbe.available ? null : pythonProbe.reason,
  tfjsNodeProbe.available ? null : tfjsNodeProbe.reason,
]
  .filter((part): part is string => part !== null)
  .join(' ');

afterAll(() => {
  disposeTfjsVariables();
});

describe('skill-export-onnx', () => {
  it('generateConversionScript names tensorflowjs Layers → tf2onnx', () => {
    const script = conversionScriptFor('./export');
    expect(script.startsWith('#!/bin/bash')).toBe(true);
    expect(script).toContain('tensorflowjs.converters.converter');
    expect(script).toContain('--input_format=tfjs_layers_model');
    expect(script).toContain('--output_format=keras_saved_model');
    expect(script).toContain('tf2onnx.convert');
    expect(script).toContain('--opset 13');
  });

  it('OnnxAgent requires load() before greedy getAction', async () => {
    const agent = new OnnxAgent({ modelPath: './missing.onnx', actionSize: 2, outputName: 'output' });
    await expect(agent.getAction([0, 0, 0, 0])).rejects.toThrow('call load()');
  });

  it('TF.js greedy actions on declared seeds and fixed observations (no convergence claim)', async () => {
    const rows: Array<{ seed: number; steps: number; actions: number[] }> = [];
    for (const seed of EXPORT_MEASUREMENT.seeds) {
      const result = await collectGreedyTfjsPolicy(seed);
      try {
        expect(result.steps).toBe(EXPORT_MEASUREMENT.trainingSteps);
        expect(result.actions).toHaveLength(3);
        for (const action of result.actions) {
          expect(action).toBeGreaterThanOrEqual(0);
          expect(action).toBeLessThan(2);
        }
        rows.push({ seed: result.seed, steps: result.steps, actions: result.actions });
      } finally {
        result.runner.stop();
        result.agent.dispose();
      }
    }
    process.stdout.write(`TFJS_GREEDY ${JSON.stringify(rows)}\n`);
    expect(rows).toHaveLength(EXPORT_MEASUREMENT.seeds.length);
  }, 60_000);

  it.skipIf(!conversionReady)(
    `ONNX greedy Q-values and actions match TF.js for seeds ${EXPORT_MEASUREMENT.seeds.join(', ')} (${conversionReady ? 'toolchain present' : conversionSkipReason})`,
    async () => {
      const python = pythonProbe.python;
      if (!python) {
        throw new Error('skipIf should have excluded this test');
      }
      const rows: Array<{
        seed: number;
        maxAbsoluteError: number;
        tfjsActions: number[];
        onnxActions: number[];
        inputName: string;
        outputName: string;
      }> = [];
      for (const seed of EXPORT_MEASUREMENT.seeds) {
        const tfjsPolicy = await collectGreedyTfjsPolicy(seed);
        try {
          const { modelPath, log } = await trySaveAndConvert(tfjsPolicy.agent.getModel(), python);
          process.stdout.write(`CONVERT_SH seed=${seed}\n${log}\n`);
          const comparison = await compareOnnxToTfjs({
            modelPath,
            actionSize: 2,
            tfjsActions: tfjsPolicy.actions,
            tfjsQValues: tfjsPolicy.qValues,
          });
          const row = {
            seed,
            maxAbsoluteError: comparison.maxAbsoluteError,
            tfjsActions: tfjsPolicy.actions,
            onnxActions: comparison.onnxActions,
            inputName: comparison.inputName,
            outputName: comparison.outputName,
          };
          process.stdout.write(`ONNX_COMPARE ${JSON.stringify(row)}\n`);
          expect(comparison.greedyMatch).toBe(true);
          expect(comparison.onnxActions).toEqual(tfjsPolicy.actions);
          rows.push(row);
        } finally {
          tfjsPolicy.runner.stop();
          tfjsPolicy.agent.dispose();
        }
      }
      process.stdout.write(`ONNX_COMPARE_ALL ${JSON.stringify(rows)}\n`);
      expect(rows).toHaveLength(EXPORT_MEASUREMENT.seeds.length);
    },
    300_000,
  );
});
