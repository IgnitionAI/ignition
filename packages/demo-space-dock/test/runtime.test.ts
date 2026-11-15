import { expect, it } from 'vitest';
import { SpaceDockEnv } from '../src/space-dock-env';
import { DockRuntime } from '../src/runtime';
it('owns one bounded fixed decision loop: no double step, pause, reset, modes, release', async () => {
  const env = await SpaceDockEnv.create(7), runtime = new DockRuntime(env);
  runtime.advance(0.05); expect(env.telemetry.ticks).toBe(0);
  runtime.advance(0.05); expect(env.telemetry.ticks).toBe(6);
  runtime.press('keyboard', 1); runtime.setPaused(true); runtime.advance(30);
  expect(env.telemetry.ticks).toBe(6); runtime.setPaused(false); runtime.advance(0.1);
  expect(env.telemetry.action).toBe(0); expect(env.telemetry.ticks).toBe(12);
  runtime.advance(50); expect(env.telemetry.ticks).toBe(30); // bounded 3 decisions
  runtime.press('keyboard', 1); runtime.press('touch', 7); runtime.advance(0.1);
  expect(env.telemetry.action).toBe(7); runtime.release('touch'); runtime.advance(0.1);
  expect(env.telemetry.action).toBe(1); runtime.setMode('auto'); expect(runtime.history).toHaveLength(7);
  runtime.reset(); expect(env.telemetry.ticks).toBe(0); expect(runtime.history).toHaveLength(0);
  runtime.dispose(); runtime.dispose(); expect(() => env.observe()).toThrow();
});
it('discarded wall time never creates a transition after done', async () => {
  const env = await SpaceDockEnv.create(8), runtime = new DockRuntime(env);
  for (let i = 0; i < 300; i++) runtime.advance(1);
  expect(env.truncated()).toBe(true); const history = runtime.history;
  runtime.advance(1); expect(runtime.history).toEqual(history); expect(env.telemetry.ticks).toBe(5400);
  runtime.dispose();
});
it('yields the environment to an external driver (DQN session) and takes it back', async () => {
  const env = await SpaceDockEnv.create(9), runtime = new DockRuntime(env);
  runtime.press('keyboard', 1); runtime.setExternal(true);
  expect(runtime.isExternal).toBe(true);
  runtime.advance(1); runtime.press('keyboard', 1); runtime.reset(3);
  expect(env.telemetry.ticks).toBe(0); expect(env.generation).toBe(1); expect(runtime.history).toHaveLength(0);
  env.step(1); // the external driver steps the same world
  runtime.setExternal(false); runtime.advance(0.1);
  expect(env.telemetry.ticks).toBe(12); expect(env.telemetry.action).toBe(0); // inputs were cleared on hand-over
  runtime.dispose();
});
