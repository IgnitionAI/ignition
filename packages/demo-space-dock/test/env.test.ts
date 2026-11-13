import { describe, expect, it } from 'vitest';
import { SpaceDockEnv } from '../src/space-dock-env';

describe('real WASM environment', () => {
  it('creates seeded independent bodies with finite 26-value observations', async () => {
    const env = await SpaceDockEnv.create(1);
    expect(env.observe()).toHaveLength(26);
    expect(env.observe().every(Number.isFinite)).toBe(true);
    expect(env.drone.mass()).toBeCloseTo(120);
    expect(env.cargo.mass()).toBeCloseTo(300);
    expect(env.drone.translation().x - env.cargo.translation().x).toBeCloseTo(2.3);
    env.dispose();
  });
});
