import { describe, expect, it } from 'vitest';
import { computeGeneralizedAdvantages } from '../src/agents/ppo';

/**
 * Hand-calculated GAE-λ fixtures. normalize=false so values match the algebra:
 *   δ_t = r_t + γ V(s_{t+1}) (1 − terminated) − V(s_t)
 *   A_t = δ_t + γλ (1 − terminated − truncated) A_{t+1}
 *   R_t = A_t + V(s_t)
 */
describe('computeGeneralizedAdvantages — hand-calculated', () => {
  it('matches a two-step Monte-Carlo trace (λ=1, no bootstrap on terminal last step)', () => {
    const result = computeGeneralizedAdvantages({
      rewards: [1, 1],
      values: [0, 0],
      nextValues: [0, 0],
      terminated: [false, true],
      truncated: [false, false],
      gamma: 0.9,
      gaeLambda: 1,
      normalize: false,
    });
    // δ1 = 1; A1 = 1
    // δ0 = 1; A0 = 1 + 0.9 * 1 = 1.9
    expect(result.advantages[0]).toBeCloseTo(1.9, 10);
    expect(result.advantages[1]).toBeCloseTo(1, 10);
    expect(result.returns[0]).toBeCloseTo(1.9, 10);
    expect(result.returns[1]).toBeCloseTo(1, 10);
  });

  it('bootstraps a non-terminal last state with the successor value', () => {
    const result = computeGeneralizedAdvantages({
      rewards: [0.5],
      values: [2],
      nextValues: [2],
      terminated: [false],
      truncated: [false],
      gamma: 0.9,
      gaeLambda: 0.95,
      normalize: false,
    });
    // δ = 0.5 + 0.9*2 − 2 = 0.3
    expect(result.advantages[0]).toBeCloseTo(0.3, 10);
    expect(result.returns[0]).toBeCloseTo(2.3, 10);
  });

  it('does not bootstrap a terminal last state', () => {
    const result = computeGeneralizedAdvantages({
      rewards: [0.5],
      values: [2],
      nextValues: [2],
      terminated: [true],
      truncated: [false],
      gamma: 0.9,
      gaeLambda: 0.95,
      normalize: false,
    });
    // δ = 0.5 − 2 = −1.5
    expect(result.advantages[0]).toBeCloseTo(-1.5, 10);
    expect(result.returns[0]).toBeCloseTo(0.5, 10);
  });

  it('bootstraps a truncated (non-terminal) step but cuts the GAE trace', () => {
    const result = computeGeneralizedAdvantages({
      rewards: [3, -100],
      values: [2, 2],
      nextValues: [2, 0],
      terminated: [false, true],
      truncated: [true, false],
      gamma: 0.9,
      gaeLambda: 1,
      normalize: false,
    });
    // t=1 terminal: δ = −100 − V = −102 (no bootstrap); A = −102
    // t=0 truncated: δ = 3 + 0.9*2 − 2 = 2.8; traceMask=0 so A = 2.8 (no −100 leak)
    expect(result.advantages[0]).toBeCloseTo(2.8, 10);
    expect(result.advantages[1]).toBeCloseTo(-102, 10);
    expect(result.returns[0]).toBeCloseTo(4.8, 10);
    expect(result.returns[1]).toBeCloseTo(-100, 10);
  });

  it('uses the actual successor value, not V(s_t)', () => {
    const result = computeGeneralizedAdvantages({
      rewards: [-0.5],
      values: [2],
      nextValues: [4],
      terminated: [false],
      truncated: [false],
      gamma: 0.9,
      gaeLambda: 1,
      normalize: false,
    });
    // δ = -0.5 + 0.9*4 − 2 = 1.1  (using V(s_t)=2 would give -0.5)
    expect(result.advantages[0]).toBeCloseTo(1.1, 10);
  });

  it('does not normalize a single transition', () => {
    const result = computeGeneralizedAdvantages({
      rewards: [1],
      values: [0],
      nextValues: [0],
      terminated: [true],
      truncated: [false],
      gamma: 0.99,
      gaeLambda: 0.95,
      normalize: true,
    });
    expect(result.advantages[0]).toBeCloseTo(1, 10);
  });
});
