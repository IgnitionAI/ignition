import { describe, expect, it } from 'vitest';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { validateTrainingEnv } from '@ignitionai/core';
import { SpaceDockEnv } from '../src/space-dock-env';
import { DockTrainingEnv, REWARD_BOUNDS, TRAINING_ENV, episodeSeed } from '../src/dock-training-env';
import { createPDState, scriptedPD } from '../src/pd-controller';
import { PARAMETERS } from '../src/simulation-contract';

async function make(options: ConstructorParameters<typeof DockTrainingEnv>[1] = {}) {
  const env = new DockTrainingEnv(await SpaceDockEnv.create(1), options);
  env.reset(options.seed ?? 11);
  return env;
}
function run(env: DockTrainingEnv, policy: (step: number) => number, limit = 2000) {
  const rewards: number[] = [];
  for (let step = 0; step < limit && !env.done(); step++) { env.step(policy(step)); rewards.push(env.reward()); }
  return rewards;
}

describe('DockTrainingEnv contract', () => {
  it('satisfies TrainingEnv with 26 normalized observations and 8 discrete actions', async () => {
    const env = await make();
    try {
      expect(() => validateTrainingEnv(env)).not.toThrow();
      expect(env.actions).toBe(8);
      expect(TRAINING_ENV).toMatchObject({ observationSize: 26, actionCount: 8 });
      for (let step = 0; step < 40; step++) {
        const observation = env.observe();
        expect(observation).toHaveLength(26);
        expect(observation.every(value => Number.isFinite(value) && value >= -1 && value <= 1)).toBe(true);
        env.step(step % 8);
      }
      expect(env.observe()[16]).toBeCloseTo((env.maxSteps - env.steps) / env.maxSteps);
      for (const bad of [-1, 8, 1.5, Number.NaN, [1]]) expect(() => env.step(bad)).toThrow(RangeError);
      // The IgnitionAI runner accepts it as-is.
      expect(() => new IgnitionEnvTFJS(env)).not.toThrow();
    } finally { env.dock.dispose(); }
  });

  it('keeps every transition reward finite and inside the declared bounds', async () => {
    expect(REWARD_BOUNDS).toEqual({ min: -12, max: 11 });
    const env = await make({ seed: 5 });
    try {
      let state = 99;
      const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state % 8; };
      const rewards: number[] = [];
      for (let episode = 0; episode < 4; episode++) { rewards.push(...run(env, random)); env.reset(); }
      rewards.push(...run(env, () => 1)); // full thrust into the dock wall
      expect(rewards.length).toBeGreaterThan(100);
      for (const reward of rewards) {
        expect(Number.isFinite(reward)).toBe(true);
        expect(reward).toBeGreaterThanOrEqual(REWARD_BOUNDS.min);
        expect(reward).toBeLessThanOrEqual(REWARD_BOUNDS.max);
      }
    } finally { env.dock.dispose(); }
  });

  it('rewards progress toward the dock and penalizes moving away', async () => {
    const env = await make();
    try {
      const toward = run(env, () => 1, 10);
      env.reset(11);
      const away = run(env, () => 2, 10);
      expect(toward.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
      expect(away.reduce((a, b) => a + b, 0)).toBeLessThan(0);
    } finally { env.dock.dispose(); }
  });

  it('terminates on a successful docking (scripted PD reference), with the success bonus', async () => {
    const env = await make({ seed: 42 });
    try {
      const controller = createPDState();
      const rewards = run(env, () => scriptedPD(env.dock.telemetry, controller), TRAINING_ENV.maxSteps);
      expect(env.outcome).toBe('success');
      expect(env.terminated()).toBe(true); expect(env.truncated()).toBe(false); expect(env.done()).toBe(true);
      expect(rewards.at(-1)).toBeGreaterThan(9);
      expect(env.lastEpisode).toMatchObject({ outcome: 'success', seed: 42, steps: env.steps });
      expect(env.lastEpisode!.return).toBeCloseTo(rewards.reduce((a, b) => a + b, 0));
      const steps = env.steps; env.step(0); expect(env.steps).toBe(steps); // no transition after terminal
    } finally { env.dock.dispose(); }
  });

  it('terminates on a collision, as a failure', async () => {
    const env = await make();
    try {
      const rewards = run(env, () => 1, TRAINING_ENV.maxSteps);
      expect(env.outcome).toBe('collision');
      expect(env.terminated()).toBe(true); expect(env.truncated()).toBe(false);
      expect(env.dock.telemetry.contacts).toBeGreaterThan(0);
      expect(rewards.at(-1)).toBeLessThan(-9);
    } finally { env.dock.dispose(); }
  });

  it('can keep running through contacts when collision termination is disabled', async () => {
    const env = await make({ terminateOnCollision: false, maxSteps: 120 });
    try {
      const rewards = run(env, () => 1);
      expect(env.dock.telemetry.contacts).toBeGreaterThan(0);
      expect(env.outcome).not.toBe('collision');
      expect(Math.min(...rewards)).toBeGreaterThanOrEqual(REWARD_BOUNDS.min);
    } finally { env.dock.dispose(); }
  });

  it('terminates when leaving the bounds', async () => {
    const env = await make();
    try {
      run(env, () => 2, TRAINING_ENV.maxSteps);
      expect(env.outcome).toBe('bounds');
      expect(env.terminated()).toBe(true);
    } finally { env.dock.dispose(); }
  });

  it('truncates (not terminates) at the horizon', async () => {
    const env = await make({ maxSteps: 25 });
    try {
      run(env, () => 0);
      expect(env.steps).toBe(25);
      expect(env.outcome).toBe('timeout');
      expect(env.truncated()).toBe(true); expect(env.terminated()).toBe(false); expect(env.done()).toBe(true);
      expect(env.dock.telemetry.ticks).toBe(25 * PARAMETERS.substeps);
    } finally { env.dock.dispose(); }
  });

  it('resets deterministically from a seed and derives the next episode seeds', async () => {
    const first = await make({ seed: 77 }), second = await make({ seed: 77 });
    try {
      const trace = (env: DockTrainingEnv) => {
        const values = [env.observe()];
        for (let step = 0; step < 30; step++) { env.step([1, 5, 3, 0, 7, 2][step % 6]); values.push([...env.observe(), env.reward()]); }
        return values;
      };
      const a = trace(first), b = trace(second);
      expect(a).toEqual(b);
      first.reset(77);
      expect(first.steps).toBe(0); expect(first.outcome).toBe('running'); expect(first.seed).toBe(77);
      expect(trace(first)).toEqual(a);
      first.reset(); second.reset();
      expect(first.seed).toBe(episodeSeed(77, 1)); expect(second.seed).toBe(first.seed);
      expect(first.observe()).toEqual(second.observe());
      expect(first.seed).not.toBe(77);
      expect(() => first.reset(-1)).toThrow(RangeError);
    } finally { first.dock.dispose(); second.dock.dispose(); }
  });

  it('curriculum starts place the pair at rest on the axis, seeded, without changing the docking criterion', async () => {
    const env = await make({ startDistance: [1, 4] });
    try {
      const distances: number[] = [];
      for (let episode = 0; episode < 6; episode++) {
        env.reset();
        const t = env.dock.telemetry;
        distances.push(t.distance);
        expect(t.distance).toBeGreaterThanOrEqual(1 - 1e-6); expect(t.distance).toBeLessThanOrEqual(4 + 1e-6);
        expect(t.drone.position.x - t.cargo.position.x).toBeCloseTo(2.3);
        expect(Math.hypot(t.cargo.velocity.x, t.cargo.velocity.z)).toBe(0);
        expect(t.ticks).toBe(0); expect(env.stale).toBe(false);
        expect(env.observe().every(v => Number.isFinite(v) && Math.abs(v) <= 1)).toBe(true);
      }
      expect(new Set(distances.map(d => d.toFixed(3))).size).toBeGreaterThan(1);
      const again = await make({ startDistance: [1, 4] });
      try { for (let i = 0; i < 6; i++) again.reset(); expect(again.dock.telemetry.distance).toBeCloseTo(distances[5]); }
      finally { again.dock.dispose(); }
      // Still the SpaceDockEnv success rule: the scripted PD docks from a near start and must hold 90 ticks.
      env.reset(42);
      const controller = createPDState();
      run(env, () => scriptedPD(env.dock.telemetry, controller), TRAINING_ENV.maxSteps);
      expect(env.outcome).toBe('success'); expect(env.dock.telemetry.holdSeconds).toBeGreaterThanOrEqual(1.5 - 1e-9);
      env.dock.step(0);
      expect(() => env.dock.placeOnAxis(0)).toThrow(/after reset/);
      expect(() => new DockTrainingEnv(env.dock, { startDistance: [3, 1] })).toThrow(RangeError);
    } finally { env.dock.dispose(); }
  });

  it('refuses to step a dock reset or stepped behind its back', async () => {
    const env = await make();
    try {
      env.dock.reset(3);
      expect(env.stale).toBe(true);
      expect(() => env.step(0)).toThrow(/reset/);
      env.reset(); expect(env.stale).toBe(false);
      env.step(1); expect(env.stale).toBe(false);
      env.dock.step(0); // a foreign transition (manual / PD runtime)
      expect(env.stale).toBe(true);
      expect(() => env.step(0)).toThrow(/outside/);
    } finally { env.dock.dispose(); }
  });
});
