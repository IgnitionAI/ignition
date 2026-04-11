import { describe, it, expect } from 'vitest';
import { ExperienceSchema } from '../src/schemas';
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
