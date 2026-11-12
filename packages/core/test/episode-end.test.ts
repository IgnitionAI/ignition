import { expect, it, vi } from 'vitest';
import { IgnitionEnv } from '../src/ignition-env';

it.each(['step', 'inferStep'] as const)('%s reports truncation and resets without losing the last observation', async (method) => {
  let position = 0;
  const world = {
    actions: 2, observe: () => [position], step: () => { position = 5; },
    reward: () => 1, done: () => true, truncated: () => true,
    reset: () => { position = 0; },
  };
  const loop = new IgnitionEnv(world);
  const remember = vi.fn();
  loop.agent = { getAction: async () => 0, remember, train: async () => {} };
  expect(await loop[method]()).toEqual({ observation: [5], reward: 1, terminated: false, truncated: true });
  expect(position).toBe(0);
  if (method === 'step') expect(remember).toHaveBeenCalledWith(expect.objectContaining({ nextState: [5], terminated: false, truncated: true }));
});

it('prefers canonical terminated/truncated over is* aliases when both are defined', async () => {
  const terminated = vi.fn(() => false);
  const truncated = vi.fn(() => false);
  const isTerminated = vi.fn(() => true);
  const isTruncated = vi.fn(() => true);
  const loop = new IgnitionEnv({
    actions: 2, observe: () => [0], step: () => {}, reward: () => 0,
    done: () => true, reset: () => {}, terminated, truncated, isTerminated, isTruncated,
  });
  loop.agent = { getAction: async () => 0, remember: () => {}, train: async () => {} };
  expect(await loop.step()).toMatchObject({ terminated: false, truncated: false });
  expect(terminated).toHaveBeenCalledTimes(1);
  expect(truncated).toHaveBeenCalledTimes(1);
  expect(isTerminated).not.toHaveBeenCalled();
  expect(isTruncated).not.toHaveBeenCalled();
});

it('prefers done() over isDone() when both are defined', async () => {
  const done = vi.fn(() => false);
  const isDone = vi.fn(() => true);
  const loop = new IgnitionEnv({
    actions: 2, observe: () => [0], step: () => {}, reward: () => 0, reset: () => {}, done, isDone,
  });
  loop.agent = { getAction: async () => 0, remember: () => {}, train: async () => {} };
  expect(await loop.step()).toMatchObject({ terminated: false, truncated: false });
  expect(done).toHaveBeenCalledTimes(1);
  expect(isDone).not.toHaveBeenCalled();
});

it('uses isTerminated/isTruncated/isDone when canonical methods are absent', async () => {
  const isTerminated = vi.fn(() => false);
  const isTruncated = vi.fn(() => true);
  const isDone = vi.fn(() => true);
  const reset = vi.fn();
  const loop = new IgnitionEnv({
    actions: 2, observe: () => [0], step: () => {}, reward: () => 0, reset, isTerminated, isTruncated, isDone,
  });
  loop.agent = { getAction: async () => 0, remember: () => {}, train: async () => {} };
  expect(await loop.step()).toMatchObject({ terminated: false, truncated: true });
  expect(isTerminated).toHaveBeenCalledTimes(1);
  expect(isTruncated).toHaveBeenCalledTimes(1);
  expect(isDone).not.toHaveBeenCalled();
  expect(reset).toHaveBeenCalledTimes(1);
});

it('honors isTerminated/isTruncated aliases over done()', async () => {
  const reset = vi.fn();
  const loop = new IgnitionEnv({
    actions: 2, observe: () => [0], step: () => {}, reward: () => 0,
    done: () => true, reset, isTerminated: () => false, isTruncated: () => true,
  });
  loop.agent = { getAction: async () => 0, remember: () => {}, train: async () => {} };
  expect(await loop.step()).toMatchObject({ terminated: false, truncated: true });
  expect(reset).toHaveBeenCalledTimes(1);
});

it.each([
  { explicit: undefined, truncated: undefined, terminal: true, cut: false },
  { explicit: true, truncated: true, terminal: true, cut: true },
  { explicit: false, truncated: false, terminal: false, cut: false },
])('preserves legacy done and explicit terminal precedence: %j', async ({ explicit, truncated, terminal, cut }) => {
  const reset = vi.fn();
  const loop = new IgnitionEnv({ actions: 2, observe: () => [0], step: () => {},
    reward: () => 0, done: () => true, reset,
    ...(explicit === undefined ? {} : { terminated: () => explicit }),
    ...(truncated === undefined ? {} : { truncated: () => truncated }),
  });
  loop.agent = { getAction: async () => 0, remember: () => {}, train: async () => {} };
  expect(await loop.step()).toMatchObject({ terminated: terminal, truncated: cut });
  expect(reset).toHaveBeenCalledTimes(terminal || cut ? 1 : 0);
});

it.each(['terminated', 'truncated', 'isTerminated', 'isTruncated', 'isDone'])(
  'rejects a non-function %s callback at construction',
  (name) => {
    expect(() => new IgnitionEnv({ actions: 2, observe: () => [0], step: () => {},
      reward: () => 0, done: () => false, reset: () => {}, [name]: true,
    })).toThrow(new RegExp(name));
  },
);
