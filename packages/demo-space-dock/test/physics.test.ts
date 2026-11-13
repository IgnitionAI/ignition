import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SpaceDockEnv } from '../src/space-dock-env';
let env: SpaceDockEnv;
beforeEach(async () => { env = await SpaceDockEnv.create(42); });
afterEach(() => env.dispose());
function advance(action: number, count: number) { for (let i = 0; i < count; i++) env.step(action); }
function place(x: number, z = 0, yaw = 0, speed = 0, angularSpeed = 0) {
  env.cargo.setTranslation({ x, y: 0, z }, true);
  env.drone.setTranslation({ x: x + 2.3 * Math.cos(yaw), y: 0, z: z - 2.3 * Math.sin(yaw) }, true);
  for (const body of [env.cargo, env.drone]) {
    body.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }, true);
    const radius = body === env.drone ? 2.3 * 300 / 420 : -2.3 * 120 / 420;
    body.setLinvel({ x: speed - angularSpeed * radius * Math.sin(yaw), y: 0, z: -angularSpeed * radius * Math.cos(yaw) }, true); body.setAngvel({ x: 0, y: angularSpeed, z: 0 }, true);
  }
}
describe('Rapier forces and constraints', () => {
  it('accelerates 420kg, clears forces and preserves no-op inertia', () => {
    env.step(1); expect(env.cargo.linvel().x).toBeCloseTo(1 / 7, 2);
    const velocity = env.cargo.linvel().x; advance(0, 10); expect(env.cargo.linvel().x).toBeCloseTo(velocity, 4);
    expect(env.drone.userForce()).toEqual({ x: 0, y: 0, z: 0 });
    expect(env.drone.userTorque()).toEqual({ x: 0, y: 0, z: 0 });
  });
  it('transforms local thrust and applies positive yaw', () => {
    place(-7, 0, Math.PI / 2); env.step(1); expect(env.cargo.linvel().z).toBeLessThan(-0.13);
    expect(Math.abs(env.cargo.linvel().x)).toBeLessThan(0.002);
    env.reset(); env.step(5); expect(env.cargo.angvel().y).toBeGreaterThan(0.04);
  });
  it('lateral thrust induces yaw; anchors stay <1cm and orientations <0.5deg', () => {
    advance(3, 8); const c = env.cargo.translation(), d = env.drone.translation(), yaw = env.telemetry.cargo.yaw;
    const anchorError = Math.hypot(d.x - c.x - 2.3 * Math.cos(yaw), d.z - c.z + 2.3 * Math.sin(yaw));
    const angleError = Math.abs(env.telemetry.drone.yaw - yaw);
    expect(env.cargo.angvel().y).toBeGreaterThan(0.15);
    expect(anchorError).toBeLessThan(0.01); expect(angleError).toBeLessThan(Math.PI / 360);
    expect(d.y).toBe(0); expect(env.drone.rotation().x).toBe(0); expect(env.drone.rotation().z).toBe(0);
    console.info(JSON.stringify({ anchorError, angleError }));
  });
  it('brakes with bounded dissipative forces', () => {
    place(-7, 0, 0, 3); env.step(7); expect(env.cargo.linvel().x).toBeGreaterThan(2.8);
    expect(env.cargo.linvel().x).toBeLessThan(3);
    expect(Math.hypot(env.telemetry.force.x, env.telemetry.force.z)).toBeLessThanOrEqual(600);
    expect(Math.abs(env.telemetry.torque)).toBeLessThanOrEqual(300);
    expect(env.telemetry.force.x * env.telemetry.drone.velocity.x).toBeLessThan(0);
  });
  it('prevents traversal and counts continuous contact once', () => {
    place(5); advance(1, 120); expect(env.drone.translation().x).toBeLessThan(9.55);
    expect(env.telemetry.contacts).toBeGreaterThan(0); env.reset(); place(7.2); env.step(1); const contacts = env.telemetry.contacts;
    expect(contacts).toBe(1); env.step(1); expect(env.telemetry.contacts).toBe(contacts);
    console.info(JSON.stringify({ wallDroneX: env.drone.translation().x, contacts }));
  });
});
describe('episode lifecycle', () => {
  it('validates before mutation and replays seeds deterministically', () => {
    const initial = env.observe(), generation = env.generation;
    for (const a of [-1, 8, 0.5, NaN, Infinity, [1]]) expect(() => env.step(a)).toThrow();
    for (const s of [-1, 2 ** 32, NaN, 1.5]) expect(() => env.reset(s)).toThrow();
    expect(env.observe()).toEqual(initial); expect(env.generation).toBe(generation);
    advance(1, 5); const replay = env.observe(); env.reset(42); advance(1, 5); expect(env.observe()).toEqual(replay);
    env.reset(43); expect(env.observe()).not.toEqual(initial);
  });
  it('needs 1.5s dwell and freezes after terminal success', () => {
    place(6); advance(0, 14); expect(env.done()).toBe(false); expect(env.telemetry.holdSeconds).toBeCloseTo(1.4);
    env.step(0); expect(env.telemetry.outcome).toBe('success'); expect(env.terminated()).toBe(true);
    expect(env.truncated()).toBe(false); expect(env.reward()).toBeGreaterThan(29);
    const before = { t: env.telemetry, o: env.observe(), r: env.reward() }; env.step(1);
    expect({ t: env.telemetry, o: env.observe(), r: env.reward() }).toEqual(before);
  });
  it('resets dwell on position, yaw, speed and angular speed violations', () => {
    for (const v of [[6.6, 0, 0, 0, 0], [6, 0, 0.2, 0, 0], [6, 0, 0, 0.3, 0], [6, 0, 0, 0, 0.2]]) {
      env.reset(); place(6); advance(0, 10); expect(env.telemetry.holdSeconds).toBe(1);
      place(...v as [number, number, number, number, number]); env.step(0);
      expect(env.telemetry.holdSeconds).toBe(0); expect(env.done()).toBe(false);
    }
  });
  it('truncates at 90s but success wins on final tick', () => {
    advance(0, 900); expect(env.truncated()).toBe(true); expect(env.terminated()).toBe(false);
    expect(env.telemetry.ticks).toBe(5400); env.reset(); advance(0, 885); place(6); advance(0, 15);
    expect(env.telemetry.outcome).toBe('success'); expect(env.telemetry.ticks).toBe(5400);
  });
  it('fails bounds / nonfinite before solver, with finite observations', () => {
    place(-15); env.step(0); expect(env.telemetry.outcome).toBe('bounds'); expect(env.telemetry.ticks).toBe(0);
    env.reset(); env.cargo.setLinvel({ x: NaN, y: 0, z: 0 }, true); env.step(0);
    expect(env.telemetry.outcome).toBe('nonfinite'); expect(env.telemetry.ticks).toBe(0);
    expect(env.observe().every(Number.isFinite)).toBe(true); expect(env.reward()).toBe(-30);
  });
  it('returns copied finite observations and geometric rays excluding both bodies', () => {
    const first = env.observe(); expect(first.slice(18).every(x => x >= 0 && x <= 1)).toBe(true);
    expect(first[18]).toBe(1); first[0] = 99; expect(env.observe()[0]).not.toBe(99);
    const before = env.telemetry; env.observe(); expect(env.telemetry).toEqual(before);
  });
  it('disposes idempotently, forbids reads, recreates explicitly', () => {
    env.dispose(); env.dispose(); expect(() => env.observe()).toThrow(); expect(() => env.world).toThrow();
    env.reset(); expect(env.observe()).toHaveLength(26);
  });
  it('has no bonus for waiting or passing fast near goal', () => {
    env.step(0); expect(env.reward()).toBeCloseTo(-0.01);
    env.reset(); place(6, 0, 0, 1); env.step(0); expect(env.telemetry.holdSeconds).toBe(0);
    // Positioning is an explicit boundary fixture; the first transition refreshes the snapshot.
    env.step(0); expect(env.reward()).toBeLessThan(0);
  });
});
it('rotation/no-op cannot farm signed progress and reward reads do not pay twice', () => {
  const initial = env.telemetry; let total = 0;
  for (const action of [5, 5, 5, 6, 6, 6, 6, 6, 6, 5, 5, 5, 0, 0]) {
    env.step(action); const reward = env.reward(); total += reward; env.observe();
    expect(env.reward()).toBe(reward);
  }
  const final = env.telemetry;
  const signedProgress = 2 * (initial.distance - final.distance) + 0.25 * (Math.cos(final.yawError) - Math.cos(initial.yawError));
  expect(total - signedProgress).toBeLessThanOrEqual(-0.1 * final.elapsed + 1e-9);
});
it('measures proximity from rotated cuboid surfaces and includes real solids', () => {
  expect(env.observe()[20]).toBeCloseTo(0.625, 5); // -Z: wall face 5.8m minus cargo half extent .8m
  place(6); env.step(0);
  expect(env.observe()[18]).toBeCloseTo(0.15, 5); // +X: dock face 10.3 minus drone front 9.1
});
it('failure has priority over dwell when another body is outside bounds', () => {
  place(6); advance(0, 14); env.drone.setTranslation({ x: 15, y: 0, z: 0 }, true);
  env.step(0); expect(env.telemetry.outcome).toBe('bounds'); expect(env.terminated()).toBe(true);
  expect(env.truncated()).toBe(false); expect(env.telemetry.ticks).toBe(84);
});
