import { describe, it, expect } from 'vitest';
import { validateTrainingEnv, validateInferenceEnv } from '../src/env-validation';

const validTrainingEnv = {
  actions: ['left', 'right'],
  observe: () => [0, 1],
  step: () => {},
  reward: () => 1,
  done: () => false,
  reset: () => {},
};

const validInferenceEnv = {
  observe: () => [0, 1],
  step: () => {},
};

describe('validateTrainingEnv', () => {
  it('accepts a valid training env', () => {
    expect(() => validateTrainingEnv(validTrainingEnv)).not.toThrow();
  });

  it('accepts actions as number', () => {
    expect(() => validateTrainingEnv({ ...validTrainingEnv, actions: 4 })).not.toThrow();
  });

  it('throws if observe is missing', () => {
    const { observe, ...rest } = validTrainingEnv;
    expect(() => validateTrainingEnv(rest)).toThrow(/observe/);
  });

  it('throws if step is missing', () => {
    const { step, ...rest } = validTrainingEnv;
    expect(() => validateTrainingEnv(rest)).toThrow(/step/);
  });

  it('throws if reward is missing', () => {
    const { reward, ...rest } = validTrainingEnv;
    expect(() => validateTrainingEnv(rest)).toThrow(/reward/);
  });

  it('throws if done is missing', () => {
    const { done, ...rest } = validTrainingEnv;
    expect(() => validateTrainingEnv(rest)).toThrow(/done/);
  });

  it('throws if reset is missing', () => {
    const { reset, ...rest } = validTrainingEnv;
    expect(() => validateTrainingEnv(rest)).toThrow(/reset/);
  });

  it('throws if actions is missing', () => {
    const { actions, ...rest } = validTrainingEnv;
    expect(() => validateTrainingEnv(rest)).toThrow(/actions/);
  });

  it('throws if actions is empty array', () => {
    expect(() => validateTrainingEnv({ ...validTrainingEnv, actions: [] })).toThrow(/at least one action/i);
  });

  it('throws if actions is 0', () => {
    expect(() => validateTrainingEnv({ ...validTrainingEnv, actions: 0 })).toThrow(/at least one action/i);
  });

  it('throws if observe is not a function', () => {
    expect(() => validateTrainingEnv({ ...validTrainingEnv, observe: 'nope' })).toThrow(/observe.*function/);
  });

  it('accepts a class instance (duck typing)', () => {
    class MyEnv {
      actions = ['a', 'b'];
      observe() { return [0]; }
      step() {}
      reward() { return 0; }
      done() { return false; }
      reset() {}
    }
    expect(() => validateTrainingEnv(new MyEnv())).not.toThrow();
  });
});

describe('validateInferenceEnv', () => {
  it('accepts a valid inference env', () => {
    expect(() => validateInferenceEnv(validInferenceEnv)).not.toThrow();
  });

  it('throws if observe is missing', () => {
    expect(() => validateInferenceEnv({ step: () => {} })).toThrow(/observe/);
  });

  it('throws if step is missing', () => {
    expect(() => validateInferenceEnv({ observe: () => [0] })).toThrow(/step/);
  });
});
