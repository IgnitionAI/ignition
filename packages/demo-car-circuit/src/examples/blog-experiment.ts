import * as tf from '@tensorflow/tfjs';
import { LearnedDriver } from '../racing/learned-driver';
import { trainQDriver } from '../racing/q-training';

export async function trainSmallExperiment(transitions = 64) {
  await tf.setBackend('cpu');
  await tf.ready();
  const driver = new LearnedDriver(11, 'dqn');
  const initial = driver.exportCheckpoint();
  driver.dispose();

  // A smoke run, not the full evaluation protocol.
  return trainQDriver(initial, { transitions });
}
