import { describe, expect, it } from 'vitest';
import {
  validateContinuousAction, validateContinuousBounds, validateContinuousEnv,
  type BoxSpace, type ContinuousTrainingEnv,
} from '../src';

const space = (): BoxSpace => ({ type: 'box', shape: [2], low: [-2, 0.1], high: [1, 3] });

function environment(): ContinuousTrainingEnv {
  return { actionSpace: space(), observe: () => [0, 1], step() {}, reward: () => 0,
    terminated: () => false, truncated: () => false, reset() {} };
}

describe('continuous public boundary', () => {
  it('preserves asymmetric bounds and observations independently of caller mutation', () => {
    const env = environment(), observation = [0, 1];
    env.observe = () => observation;
    const contract = validateContinuousEnv(env);
    observation[0] = 42;
    env.actionSpace.low[0] = -100;
    expect(contract.observation).toEqual([0, 1]);
    expect(() => validateContinuousAction([-3, 2], contract.bounds)).toThrow(/bounds/);
    const action = [-2, 3];
    const captured = validateContinuousAction(action, contract.bounds);
    action[0] = 99;
    expect(captured).toEqual([-2, 3]);
  });

  it.each([
    { type: 'box', shape: [0], low: [], high: [] },
    { type: 'box', shape: [1, 2], low: [-1, -1], high: [1, 1] },
    { type: 'box', shape: [1.5], low: [-1], high: [1] },
    { type: 'box', shape: [2], low: [-1], high: [1, 1] },
    { type: 'box', shape: [1], low: [0], high: [0] },
    { type: 'box', shape: [1], low: [1], high: [-1] },
    { type: 'box', shape: [1], low: [-Infinity], high: [1] },
    { type: 'box', shape: [1], low: [0], high: [NaN] },
    { type: 'box', shape: [1], low: [-Number.MAX_VALUE], high: [Number.MAX_VALUE] },
  ])('rejects a malformed continuous space %#', invalid => {
    expect(() => validateContinuousBounds(invalid as BoxSpace)).toThrow(/Continuous/);
  });

  it.each([[0], [0, Infinity], [NaN, 1], [0, 4], new Array<number>(2)])(
    'rejects malformed, sparse, nonfinite or out-of-bounds actions %#', action => {
      expect(() => validateContinuousAction(action, validateContinuousBounds(space()))).toThrow(/Continuous/);
    },
  );

  it.each([[], [0, NaN], new Array<number>(2)])('rejects invalid initial observations %#', observation => {
    const env = environment();
    env.observe = () => observation;
    expect(() => validateContinuousEnv(env)).toThrow(/Observation/);
  });
});
