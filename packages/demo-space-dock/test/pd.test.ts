import { expect, it } from 'vitest';
import { SpaceDockEnv } from '../src/space-dock-env';
import { createPDState, scriptedPD } from '../src/pd-controller';
it('qualifies untrained PD with real seeded missions and no body writes', async () => {
  const results = [];
  for (const seed of [0, 1, 42, 2026, 4294967295]) {
    const env = await SpaceDockEnv.create(seed), controller = createPDState(); let totalReward = 0;
    for (let step = 0; step < 900 && !env.done(); step++) { env.step(scriptedPD(env.telemetry, controller)); totalReward += env.reward(); }
    const t = env.telemetry; results.push({ seed, outcome: t.outcome, elapsed: t.elapsed, distance: t.distance,
      speed: Math.hypot(t.cargo.velocity.x, t.cargo.velocity.z), yawError: t.yawError, contacts: t.contacts, totalReward });
    env.dispose();
  }
  console.info(JSON.stringify(results)); expect(results.every(r => r.outcome === 'success')).toBe(true);
});
it('reports off-axis diagnostics separately, without asserting competence', async () => {
  const results = [];
  for (const initial of [{ seed: 42, z: 1, yaw: 0 }, { seed: 2026, z: -1, yaw: 0.2 }, { seed: 4294967295, z: 2, yaw: -0.3 }]) {
    const env = await SpaceDockEnv.create(initial.seed), state = createPDState();
    const x = env.cargo.translation().x;
    // Diagnostic fixture only; every subsequent mission step uses discrete physical forces.
    env.cargo.setTranslation({ x, y: 0, z: initial.z }, true);
    env.drone.setTranslation({ x: x + 2.3 * Math.cos(initial.yaw), y: 0, z: initial.z - 2.3 * Math.sin(initial.yaw) }, true);
    for (const body of [env.cargo, env.drone]) body.setRotation({ x: 0, y: Math.sin(initial.yaw / 2), z: 0, w: Math.cos(initial.yaw / 2) }, true);
    env.step(0); // refresh measured telemetry after explicit diagnostic positioning
    for (let index = 0; index < 899 && !env.done(); index++) env.step(scriptedPD(env.telemetry, state));
    const t = env.telemetry; results.push({ ...initial, outcome: t.outcome, elapsed: t.elapsed, distance: t.distance,
      yawError: t.yawError, speed: Math.hypot(t.cargo.velocity.x, t.cargo.velocity.z), contacts: t.contacts });
    expect(env.done()).toBe(true); expect(env.observe().every(Number.isFinite)).toBe(true); env.dispose();
  }
  console.info('DIAGNOSTICS ONLY ' + JSON.stringify(results));
});
