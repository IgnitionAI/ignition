import { expect, it } from 'vitest';
import { PointMassEnv } from '../examples/continuous/point-mass';

it('applies the predeclared damped acceleration and reward without accepting invalid actions', () => {
  const env = new PointMassEnv(11), before = env.observe();
  expect(() => env.step([3])).toThrow(/bounds/);
  expect(env.observe()).toEqual(before);
  env.step([2]);
  const velocity = (before[1] + 0.1) * 0.98, position = before[0] + velocity * 0.05;
  expect(env.observe()).toEqual([position, velocity]);
  expect(env.reward()).toBe(-(position ** 2 + 0.1 * velocity ** 2 + 0.04));
});

it('distinguishes a time limit from leaving the physical domain', () => {
  const horizon = new PointMassEnv(11), escape = new PointMassEnv(11);
  for (let i = 0; i < 100; i++) horizon.step([0]);
  expect(horizon.truncated()).toBe(true); expect(horizon.terminated()).toBe(false);
  while (!escape.terminated() && !escape.truncated()) escape.step([2]);
  expect(escape.terminated()).toBe(true); expect(escape.truncated()).toBe(false);
  expect(escape.reward()).toBeLessThan(-10);
  expect(() => escape.step([0])).toThrow(/Reset/);
  escape.reset();
  expect(escape.steps).toBe(0); expect(escape.terminated()).toBe(false);
});
