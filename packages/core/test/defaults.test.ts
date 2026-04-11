import { describe, it, expect } from 'vitest';
import { mergeDefaults } from '../src/defaults';

describe('mergeDefaults', () => {
  const defaults = { lr: 0.001, gamma: 0.99, epsilon: 1.0, hiddenLayers: [64, 64] };

  it('returns defaults when no overrides', () => {
    expect(mergeDefaults(defaults, {})).toEqual(defaults);
  });

  it('returns defaults when overrides is undefined', () => {
    expect(mergeDefaults(defaults, undefined)).toEqual(defaults);
  });

  it('overrides specific fields', () => {
    const result = mergeDefaults(defaults, { lr: 0.01 });
    expect(result.lr).toBe(0.01);
    expect(result.gamma).toBe(0.99); // untouched
  });

  it('overrides arrays completely (no deep merge)', () => {
    const result = mergeDefaults(defaults, { hiddenLayers: [128, 128, 128] });
    expect(result.hiddenLayers).toEqual([128, 128, 128]);
  });

  it('adds deduced sizes to the result', () => {
    const result = mergeDefaults(defaults, { inputSize: 4, actionSize: 2 });
    expect(result.inputSize).toBe(4);
    expect(result.actionSize).toBe(2);
    expect(result.lr).toBe(0.001);
  });

  it('overrides take precedence over defaults', () => {
    const result = mergeDefaults(
      { lr: 0.001, gamma: 0.99 },
      { lr: 0.1, gamma: 0.95 },
    );
    expect(result.lr).toBe(0.1);
    expect(result.gamma).toBe(0.95);
  });
});
