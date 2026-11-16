/**
 * Executable helpers for the ignition-export-onnx skill.
 * Declares measurement budget before any training or conversion.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DQNAgent, IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import {
  OnnxAgent,
  createOnnxSession,
  generateConversionScript,
  runInference,
  saveForOnnxExport,
} from '@ignitionai/backend-onnx';
import { CartPoleEnv } from '@ignitionai/environments';

/** Root vitest does not alias @tensorflow/*; resolve through the TF.js package. */
const requireBackendTfjs = createRequire(resolve('packages/backend-tfjs/package.json'));
const tf = requireBackendTfjs('@tensorflow/tfjs') as {
  tidy: <T>(fn: () => T) => T;
  tensor2d: (values: number[][]) => unknown;
  Tensor2D: { new (): { arraySync: () => number[][] } };
  disposeVariables: () => void;
};

export function disposeTfjsVariables(): void {
  tf.disposeVariables();
}

/** Declared before any run. Not a convergence budget. */
export const EXPORT_MEASUREMENT = {
  seeds: [7, 13, 29] as const,
  trainingSteps: 32,
  hiddenLayers: [8] as const,
  batchSize: 4,
  memorySize: 64,
  /** Continuous Q-value match: |onnx - tfjs| <= abs + rel * |tfjs|. */
  absoluteTolerance: 1e-5,
  relativeTolerance: 1e-5,
};

export const FIXED_OBSERVATIONS: number[][] = [
  [0, 0, 0, 0],
  [0.1, -0.2, 0.03, 0.4],
  [-0.4, 0.2, -0.1, -0.3],
];

export function declareExportBudget(): string {
  return [
    'DECLARED BEFORE RUN',
    `seeds=${JSON.stringify([...EXPORT_MEASUREMENT.seeds])}`,
    `trainingSteps=${EXPORT_MEASUREMENT.trainingSteps} per seed`,
    `hiddenLayers=${JSON.stringify([...EXPORT_MEASUREMENT.hiddenLayers])}`,
    `batchSize=${EXPORT_MEASUREMENT.batchSize}`,
    `memorySize=${EXPORT_MEASUREMENT.memorySize}`,
    `observations=${JSON.stringify(FIXED_OBSERVATIONS)}`,
    `qValueTolerance=abs ${EXPORT_MEASUREMENT.absoluteTolerance} + rel ${EXPORT_MEASUREMENT.relativeTolerance} * |tfjs|`,
    'greedyActions=exact match',
    'not a CartPole convergence experiment',
  ].join('\n');
}

export function qValueWithinTolerance(onnx: number, tfjs: number): boolean {
  const difference = Math.abs(onnx - tfjs);
  const limit =
    EXPORT_MEASUREMENT.absoluteTolerance +
    EXPORT_MEASUREMENT.relativeTolerance * Math.abs(tfjs);
  return Number.isFinite(difference) && difference <= limit;
}

export function conversionScriptFor(outputDir: string, opset = 13): string {
  const resolvedDir = resolve(outputDir);
  return generateConversionScript(resolvedDir, `${resolvedDir}_savedmodel`, `${resolvedDir}.onnx`, opset);
}

export async function collectGreedyTfjsPolicy(seed: number): Promise<{
  seed: number;
  steps: number;
  actions: number[];
  qValues: number[][];
  agent: DQNAgent;
  runner: IgnitionEnvTFJS;
}> {
  const runner = new IgnitionEnvTFJS(new CartPoleEnv());
  runner.train('dqn', {
    backend: 'cpu',
    hiddenLayers: [...EXPORT_MEASUREMENT.hiddenLayers],
    batchSize: EXPORT_MEASUREMENT.batchSize,
    memorySize: EXPORT_MEASUREMENT.memorySize,
    seed,
  });
  runner.stop();
  const agent = runner.agent;
  if (!(agent instanceof DQNAgent)) {
    throw new Error('Expected DQN');
  }
  for (let step = 0; step < EXPORT_MEASUREMENT.trainingSteps; step++) {
    await runner.step();
  }
  const qValues = tf.tidy(() => {
    const predicted = agent.getModel().predict(tf.tensor2d(FIXED_OBSERVATIONS) as never) as {
      arraySync: () => number[][];
    };
    return predicted.arraySync();
  });
  const actions: number[] = [];
  for (const observation of FIXED_OBSERVATIONS) {
    const action = await agent.getAction(observation, true);
    if (typeof action !== 'number') {
      throw new Error('Expected discrete greedy action');
    }
    actions.push(action);
  }
  return { seed, steps: runner.stepCount, actions, qValues, agent, runner };
}

const CONVERSION_IMPORT_CHECK =
  'import tensorflowjs, tf2onnx, onnxruntime; assert tensorflowjs.__version__; assert tf2onnx.__version__';

function pythonCandidates(): string[] {
  const fromEnv = process.env.IGNITION_ONNX_PYTHON;
  const localVenv = resolve('.venv-onnx/bin/python');
  return [
    ...(fromEnv ? [fromEnv] : []),
    ...(existsSync(localVenv) ? [localVenv] : []),
    'python3.11',
    'python3',
    'python',
  ];
}

export function probePythonConversion(): { available: boolean; python?: string; reason: string } {
  const errors: string[] = [];
  for (const python of pythonCandidates()) {
    try {
      execFileSync(python, ['-c', CONVERSION_IMPORT_CHECK], { stdio: 'ignore' });
      return {
        available: true,
        python,
        reason: `${python} imports tensorflowjs, tf2onnx, and onnxruntime`,
      };
    } catch (error) {
      errors.push(`${python}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    }
  }
  return {
    available: false,
    reason:
      'No Python 3.11 venv with tensorflowjs, tf2onnx, and onnxruntime. Install with: uv python install 3.11 && uv venv .venv-onnx --python 3.11 && uv pip install --python .venv-onnx/bin/python -r packages/backend-onnx/examples/requirements-onnx.txt onnxruntime==1.16.3. Then export IGNITION_ONNX_PYTHON="$PWD/.venv-onnx/bin/python". ' +
      errors.join(' | '),
  };
}

export function probeTfjsNodeFileHandler(): { available: boolean; reason: string } {
  try {
    requireBackendTfjs.resolve('@tensorflow/tfjs-node');
    requireBackendTfjs('@tensorflow/tfjs-node');
    return { available: true, reason: '@tensorflow/tfjs-node loaded (file:// save handler)' };
  } catch (error) {
    return {
      available: false,
      reason: `@tensorflow/tfjs-node not resolvable from @ignitionai/backend-tfjs (${error instanceof Error ? error.message : String(error)}). saveForOnnxExport uses file://.`,
    };
  }
}

export async function compareOnnxToTfjs(params: {
  modelPath: string;
  actionSize: number;
  tfjsActions: number[];
  tfjsQValues: number[][];
}): Promise<{
  greedyMatch: boolean;
  maxAbsoluteError: number;
  onnxActions: number[];
  inputName: string;
  outputName: string;
}> {
  const session = await createOnnxSession(params.modelPath);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const policy = new OnnxAgent({
    modelPath: params.modelPath,
    actionSize: params.actionSize,
    inputName,
    outputName,
  });
  await policy.load();
  let maxAbsoluteError = 0;
  const onnxActions: number[] = [];
  try {
    for (let row = 0; row < FIXED_OBSERVATIONS.length; row++) {
      const values = await runInference(
        session,
        new Float32Array(FIXED_OBSERVATIONS[row]),
        [1, FIXED_OBSERVATIONS[row].length],
        inputName,
        outputName,
      );
      if (values.length !== params.tfjsQValues[row].length) {
        throw new Error('ONNX output dimension mismatch');
      }
      for (let action = 0; action < values.length; action++) {
        const difference = Math.abs(values[action] - params.tfjsQValues[row][action]);
        maxAbsoluteError = Math.max(maxAbsoluteError, difference);
        if (!qValueWithinTolerance(values[action], params.tfjsQValues[row][action])) {
          throw new Error(`ONNX Q-value mismatch at row ${row}, action ${action}`);
        }
      }
      const onnxAction = await policy.getAction(FIXED_OBSERVATIONS[row]);
      onnxActions.push(onnxAction);
      if (onnxAction !== params.tfjsActions[row]) {
        throw new Error(`ONNX greedy action mismatch at row ${row}`);
      }
    }
  } finally {
    await session.release();
    policy.dispose();
  }
  return {
    greedyMatch: true,
    maxAbsoluteError,
    onnxActions,
    inputName,
    outputName,
  };
}

export async function trySaveAndConvert(
  model: { save: (url: string) => Promise<unknown> },
  python: string,
): Promise<{ modelPath: string; log: string }> {
  const output = mkdtempSync(join(tmpdir(), 'skill-export-onnx-'));
  const modelDir = join(output, 'model');
  const { conversionScript } = await saveForOnnxExport(model, modelDir);
  const scriptPath = join(output, 'convert.sh');
  writeFileSync(scriptPath, conversionScript);
  try {
    const log = execFileSync('bash', [scriptPath], {
      encoding: 'utf8',
      env: { ...process.env, PYTHON: python, TF_NUM_INTEROP_THREADS: '1', TF_NUM_INTRAOP_THREADS: '1' },
    });
    return { modelPath: `${modelDir}.onnx`, log };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; status?: number; message?: string };
    const log = [err.stdout ?? '', err.stderr ?? '', err.message ?? ''].filter(Boolean).join('\n');
    process.stderr.write(`CONVERT_SH_FAILED exit=${err.status ?? 'unknown'}\n${log}\n`);
    throw error;
  }
}
