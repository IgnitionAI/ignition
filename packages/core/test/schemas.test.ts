import { describe, it, expect } from 'vitest';
import { ExperienceSchema, TrainingEnvSchema } from '../src/schemas';
import { EPISODE_FLAG_NAMES } from '../src/types';
import type { Experience } from '../src/types';

describe('ExperienceSchema', () => {
  it('accepts a valid experience', () => {
    const exp: Experience = {
      state: [0.1, 0.2],
      action: 1,
      reward: -1,
      nextState: [0.3, 0.4],
      terminated: false,
      truncated: false,
    };
    expect(() => ExperienceSchema.parse(exp)).not.toThrow();
  });

  it('rejects non-array state', () => {
    expect(() =>
      ExperienceSchema.parse({ state: 'bad', action: 0, reward: 0, nextState: [], terminated: false, truncated: false })
    ).toThrow();
  });

  it('rejects non-number action', () => {
    expect(() =>
      ExperienceSchema.parse({ state: [], action: 'a', reward: 0, nextState: [], terminated: false, truncated: false })
    ).toThrow();
  });

  it('rejects non-boolean terminated', () => {
    expect(() =>
      ExperienceSchema.parse({ state: [], action: 0, reward: 0, nextState: [], terminated: 'yes', truncated: false })
    ).toThrow();
  });
});

describe('TrainingEnvSchema', () => {
  const valid = {
    actions: 2,
    observe: () => [0],
    step: () => {},
    reward: () => 0,
    reset: () => {},
    done: () => false,
  };

  it('accepts isTerminated, isTruncated and isDone aliases', () => {
    expect(() => TrainingEnvSchema.parse({
      ...valid,
      isTerminated: () => false,
      isTruncated: () => false,
      isDone: () => false,
    })).not.toThrow();
  });

  it('accepts canonical done() alone', () => {
    expect(() => TrainingEnvSchema.parse(valid)).not.toThrow();
  });

  it('accepts alias isDone() alone', () => {
    const { done: _done, ...rest } = valid;
    expect(() => TrainingEnvSchema.parse({ ...rest, isDone: () => false })).not.toThrow();
  });

  it('accepts both done() and isDone()', () => {
    expect(() => TrainingEnvSchema.parse({ ...valid, isDone: () => false })).not.toThrow();
  });

  it('rejects an env with neither done nor isDone', () => {
    const { done: _done, ...rest } = valid;
    expect(() => TrainingEnvSchema.parse(rest)).toThrow(/done\(\) or isDone\(\)/);
  });

  it('rejects a non-function isTerminated', () => {
    expect(() => TrainingEnvSchema.parse({ ...valid, isTerminated: true })).toThrow(/isTerminated/);
  });
});

describe('EPISODE_FLAG_NAMES', () => {
  it('lists the canonical method before the is* alias for every flag', () => {
    expect(EPISODE_FLAG_NAMES.terminated).toEqual(['terminated', 'isTerminated']);
    expect(EPISODE_FLAG_NAMES.truncated).toEqual(['truncated', 'isTruncated']);
    expect(EPISODE_FLAG_NAMES.done).toEqual(['done', 'isDone']);
  });
});
