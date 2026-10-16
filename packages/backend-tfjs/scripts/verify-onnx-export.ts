/** Bundle for Node as described in backend-onnx/examples/README.md. */
import * as tf from '@tensorflow/tfjs-node';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { DQNAgent, IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';
import { saveForOnnxExport, OnnxAgent, createOnnxSession, runInference } from '@ignitionai/backend-onnx';

async function verify(): Promise<void> {
  const output = resolve(process.argv[2] ?? '/tmp/ignition-onnx-proof');
  await mkdir(output, { recursive: true });
  const runner = new IgnitionEnvTFJS(new CartPoleEnv());
  runner.train('dqn', { backend: 'node', hiddenLayers: [8], batchSize: 4, memorySize: 64, seed: 12 });
  runner.stop();
  const agent = runner.agent;
  if (!(agent instanceof DQNAgent)) throw new Error('Expected a DQN agent');
  try {
    for (let step = 0; step < 64; step++) await runner.step();
    const observations = [[0, 0, 0, 0], [0.1, -0.2, 0.03, 0.4], [-0.4, 0.2, -0.1, -0.3]];
    const expected = tf.tidy(() => (agent.getModel().predict(tf.tensor2d(observations)) as tf.Tensor2D).arraySync());
    const { conversionScript } = await saveForOnnxExport(agent.getModel(), resolve(output, 'model'));
    const scriptPath = resolve(output, 'convert.sh');
    await writeFile(scriptPath, conversionScript);
    execFileSync('bash', [scriptPath], { stdio: 'inherit', env: { ...process.env, TF_NUM_INTEROP_THREADS: '1', TF_NUM_INTRAOP_THREADS: '1' } });
    const modelPath = resolve(output, 'model.onnx');
    const session = await createOnnxSession(modelPath);
    const policy = new OnnxAgent({ modelPath, actionSize: 2, inputName: session.inputNames[0], outputName: session.outputNames[0] });
    await policy.load();
    let maxAbsoluteError = 0;
    try {
      for (let row = 0; row < observations.length; row++) {
        const values = await runInference(session, new Float32Array(observations[row]), [1, 4], session.inputNames[0], session.outputNames[0]);
        if (values.length !== expected[row].length) throw new Error('ONNX output dimension mismatch');
        for (let action = 0; action < values.length; action++) {
          const difference = Math.abs(values[action] - expected[row][action]);
          maxAbsoluteError = Math.max(maxAbsoluteError, difference);
          if (!Number.isFinite(difference) || difference > 1e-5 + 1e-5 * Math.abs(expected[row][action])) throw new Error(`ONNX output mismatch at row ${row}, action ${action}`);
        }
        if (await policy.getAction(observations[row]) !== await agent.getAction(observations[row], true)) {
          throw new Error(`ONNX greedy action mismatch at row ${row}`);
        }
      }
    } finally { await session.release(); policy.dispose(); }
    const report = { status: 'PASS', trainingSteps: runner.stepCount, observations, inputName: session.inputNames[0], outputName: session.outputNames[0], absoluteTolerance: 1e-5, relativeTolerance: 1e-5, maxAbsoluteError };
    await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } finally { runner.stop(); agent.dispose(); }
}

void verify().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
