import { expect, it, vi } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { IgnitionEnvTFJS } from '../src/ignition-env-tfjs';

it.each([11, 29, 47])('PPO learns rewarded actions through the public loop (seed %i)', async (seed) => {
  await tf.setBackend('cpu');
  let rng = seed;
  const random = vi.spyOn(Math, 'random').mockImplementation(() => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  });
  let action = 0;
  const env = new IgnitionEnvTFJS({
    actions: 2, observe: () => [0], step: (a: number | number[]) => { action = a as number; },
    reward: () => action === 1 ? 1 : -1, done: () => true, reset: () => {},
  });
  try {
    env.train('ppo', { hiddenLayers: [8], lr: 0.01, entropyCoef: 0, batchSize: 32 });
    env.stop();
    for (let i = 0; i < 512; i++) await env.step();
    let correct = 0;
    for (let i = 0; i < 200; i++) correct += (await env.agent!.getAction([0])) as number;
    expect(correct / 200).toBeGreaterThan(0.8);
  } finally {
    env.stop();
    env.agent?.dispose?.();
    random.mockRestore();
  }
}, 30000);

it.each(['reset', 'inferStep'] as const)('discards a partial rollout on %s', async (operation) => {
  const env = new IgnitionEnvTFJS({ actions: 2, observe: () => [0], step: () => {},
    reward: () => 1, done: () => false, reset: () => {} });
  try {
    env.train('ppo', { hiddenLayers: [8], rolloutSize: 2 });
    env.stop();
    await env.step();
    await env[operation]();
    await env.step();
    expect(env.agent!.getState!().trainStepCounter).toBe(0);
    await env.step();
    expect(env.agent!.getState!().trainStepCounter).toBe(1);
  } finally { env.stop(); env.agent?.dispose?.(); }
});
