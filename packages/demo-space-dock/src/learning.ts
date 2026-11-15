import * as tf from '@tensorflow/tfjs';
import { DockTrainingEnv } from './dock-training-env';
import { TrainingSession } from './training-session';
import type { DockRuntime } from './runtime';
import type { SpaceDockEnv } from './space-dock-env';
export { TrainingPanel } from './TrainingPanel';

/** Lazy chunk: TF.js loads after the scene so manual / PD stay as fast to open as before. */
export async function startLearning(env: SpaceDockEnv, runtime: DockRuntime): Promise<TrainingSession> {
  // CPU backend: the small MLP does not compete with the WebGL renderer for the GPU context.
  await tf.setBackend('cpu'); await tf.ready();
  return new TrainingSession(new DockTrainingEnv(env), { onOwnership: owned => runtime.setExternal(owned) });
}
