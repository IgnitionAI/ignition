import { expect, it, vi } from 'vitest';
import { IgnitionEnv } from '../src/ignition-env';
import type { TrainingEnv } from '../src/types';

function baseWorld() {
  return {
    actions: 2,
    observe: () => [0],
    step: () => {},
    reward: () => 0,
    reset: () => {},
  };
}

async function stepWith(world: object) {
  const loop = new IgnitionEnv({ ...baseWorld(), ...world } as TrainingEnv);
  loop.agent = { getAction: async () => 0, remember: () => {}, train: async () => {} };
  return loop.step();
}

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

it('canonical terminated() alone sets terminated', async () => {
  expect(await stepWith({ done: () => false, terminated: () => true })).toMatchObject({ terminated: true, truncated: false });
});

it('alias isTerminated() alone sets terminated', async () => {
  expect(await stepWith({ done: () => false, isTerminated: () => true })).toMatchObject({ terminated: true, truncated: false });
});

it('prefers canonical terminated() over isTerminated() when both are defined', async () => {
  const terminated = vi.fn(() => false);
  const isTerminated = vi.fn(() => true);
  expect(await stepWith({ done: () => true, terminated, isTerminated })).toMatchObject({ terminated: false, truncated: false });
  expect(terminated).toHaveBeenCalledTimes(1);
  expect(isTerminated).not.toHaveBeenCalled();
});

it('canonical truncated() alone sets truncated', async () => {
  expect(await stepWith({ done: () => false, truncated: () => true })).toMatchObject({ terminated: false, truncated: true });
});

it('alias isTruncated() alone sets truncated', async () => {
  expect(await stepWith({ done: () => false, isTruncated: () => true })).toMatchObject({ terminated: false, truncated: true });
});

it('prefers canonical truncated() over isTruncated() when both are defined', async () => {
  const truncated = vi.fn(() => false);
  const isTruncated = vi.fn(() => true);
  expect(await stepWith({ done: () => false, truncated, isTruncated })).toMatchObject({ terminated: false, truncated: false });
  expect(truncated).toHaveBeenCalledTimes(1);
  expect(isTruncated).not.toHaveBeenCalled();
});

it('canonical done() alone sets terminated', async () => {
  expect(await stepWith({ done: () => true })).toMatchObject({ terminated: true, truncated: false });
});

it('alias isDone() alone sets terminated', async () => {
  expect(await stepWith({ isDone: () => true })).toMatchObject({ terminated: true, truncated: false });
});

it('prefers canonical done() over isDone() when both are defined', async () => {
  const done = vi.fn(() => false);
  const isDone = vi.fn(() => true);
  expect(await stepWith({ done, isDone })).toMatchObject({ terminated: false, truncated: false });
  expect(done).toHaveBeenCalledTimes(1);
  expect(isDone).not.toHaveBeenCalled();
});

it('honors isTerminated/isTruncated aliases over done()', async () => {
  const reset = vi.fn();
  expect(await stepWith({
    done: () => true, reset, isTerminated: () => false, isTruncated: () => true,
  })).toMatchObject({ terminated: false, truncated: true });
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
