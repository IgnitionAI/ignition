/**
 * Inference-only CartPole demo — loads a pre-trained ONNX model and plays.
 *
 * This file demonstrates the deployment path:
 *   1. Train a DQN agent with @ignitionai/backend-tfjs
 *   2. Export to ONNX with @ignitionai/backend-onnx
 *   3. Deploy with OnnxAgent — no TF.js dependency, <50KB runtime
 *
 * Usage:
 *   import { runInferenceDemo } from './inference';
 *   await runInferenceDemo('./cartpole-dqn.onnx');
 */

import { OnnxAgent } from '@ignitionai/backend-onnx';
import { CartPoleEnv } from '@ignitionai/environments';

/**
 * Run a pre-trained ONNX agent on CartPole for N episodes.
 * No training, no TF.js — pure inference.
 */
export async function runInferenceDemo(
  modelPath: string,
  episodes = 5,
): Promise<void> {
  const env = new CartPoleEnv();
  const agent = new OnnxAgent({
    modelPath,
    actionSize: 2,
    inputName: 'dense_input',
    outputName: 'dense_3',
  });

  await agent.load();
  console.log('[Inference] Model loaded. Input names:', agent.inspect().inputs);

  for (let ep = 0; ep < episodes; ep++) {
    env.reset();
    let totalReward = 0;
    let steps = 0;

    while (!env.done()) {
      const state = env.observe();
      const action = await agent.getAction(state);
      env.step(action);
      totalReward += env.reward();
      steps++;
    }

    console.log(
      `[Inference] Episode ${ep + 1}/${episodes} — ${steps} steps — reward: ${totalReward.toFixed(2)}`,
    );
  }

  agent.dispose();
  console.log('[Inference] Demo complete');
}
