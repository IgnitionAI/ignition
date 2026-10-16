import { describe, it, expect } from 'vitest';
import {
  RobotArmEnv,
  forwardKinematics,
  configToPosition,
  gridConfigs,
  DEG,
  L1,
  L2,
  PIVOT_Y,
  Q0_VALUES,
  Q1_VALUES,
  Q2_VALUES,
  GRID_SIZE,
  SUCCESS_DISTANCE,
  MAX_COMMANDS,
  ACTION_COUNT,
  distance,
} from '../src/robot-arm-env';

describe('forward kinematics (contract robot-arm-v1)', () => {
  it('matches a hand-computed pose (q0=0, q1=45°, q2=-30°)', () => {
    const p = forwardKinematics(0, 45 * DEG, -30 * DEG);
    const r = L1 * Math.cos(45 * DEG) + L2 * Math.cos(15 * DEG);
    expect(p.x).toBeCloseTo(0, 10);
    expect(p.y).toBeCloseTo(PIVOT_Y + L1 * Math.sin(45 * DEG) + L2 * Math.sin(15 * DEG), 10);
    expect(p.z).toBeCloseTo(r, 10);
  });

  it('matches a hand-computed pose (q0=90°, q1=15°, q2=0)', () => {
    const p = forwardKinematics(90 * DEG, 15 * DEG, 0);
    const r = (L1 + L2) * Math.cos(15 * DEG);
    expect(p.x).toBeCloseTo(r, 10);
    expect(p.y).toBeCloseTo(PIVOT_Y + (L1 + L2) * Math.sin(15 * DEG), 10);
    expect(p.z).toBeCloseTo(0, 10);
  });

  it('yaw rotates the tip in the XZ plane without changing its height', () => {
    const a = forwardKinematics(0, 45 * DEG, -30 * DEG);
    const b = forwardKinematics(60 * DEG, 45 * DEG, -30 * DEG);
    expect(b.y).toBeCloseTo(a.y, 10);
    expect(Math.hypot(b.x, b.z)).toBeCloseTo(Math.hypot(a.x, a.z), 10);
  });

  it('grid exposes exactly 325 configurations', () => {
    expect(gridConfigs()).toHaveLength(GRID_SIZE);
    expect(GRID_SIZE).toBe(13 * 5 * 5);
  });
});

describe('RobotArmEnv observations', () => {
  it('returns 6 values bounded in [-1, 1]', () => {
    const env = new RobotArmEnv(11);
    for (let i = 0; i < 200; i++) {
      const obs = env.observe();
      expect(obs).toHaveLength(6);
      obs.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      });
      env.step(i % ACTION_COUNT);
      if (env.done()) env.reset();
    }
  });

  it('encodes joints exactly as q0/90°, (q1-45°)/30°, (q2+30°)/30°', () => {
    const env = new RobotArmEnv(11);
    // find indices by driving the env: reset repeatedly until we can set directly
    env.setConfig({ q0: 6, q1: 2, q2: 2 }); // q0=0°, q1=45°, q2=-30°
    const obs = env.observe();
    expect(obs[0]).toBeCloseTo(0, 10);
    expect(obs[1]).toBeCloseTo(0, 10);
    expect(obs[2]).toBeCloseTo(0, 10);
    env.setConfig({ q0: 0, q1: 0, q2: 0 }); // q0=-90°, q1=15°, q2=-60°
    const low = env.observe();
    expect(low[0]).toBeCloseTo(-1, 10);
    expect(low[1]).toBeCloseTo(-1, 10);
    expect(low[2]).toBeCloseTo(-1, 10);
    env.setConfig({ q0: 12, q1: 4, q2: 4 }); // q0=90°, q1=75°, q2=0°
    const high = env.observe();
    expect(high[0]).toBeCloseTo(1, 10);
    expect(high[1]).toBeCloseTo(1, 10);
    expect(high[2]).toBeCloseTo(1, 10);
  });

  it('exposes (target - tip)/3.2 as the last three observations', () => {
    const env = new RobotArmEnv(11);
    env.reset({ q0: 3, q1: 1, q2: 4 });
    env.setConfig({ q0: 9, q1: 3, q2: 1 });
    const obs = env.observe();
    const target = env.targetPosition;
    const tip = { x: env.tip.x, y: env.tip.y, z: env.tip.z };
    expect(obs[3]).toBeCloseTo((target.x - tip.x) / 3.2, 10);
    expect(obs[4]).toBeCloseTo((target.y - tip.y) / 3.2, 10);
    expect(obs[5]).toBeCloseTo((target.z - tip.z) / 3.2, 10);
  });
});

describe('RobotArmEnv actions and limits', () => {
  it('refuses invalid action indices explicitly', () => {
    const env = new RobotArmEnv(11);
    for (const bad of [-1, 6, 2.5, Number.NaN]) {
      expect(() => env.step(bad)).toThrow(/invalid action/);
    }
  });

  it('each of the 6 actions moves exactly one joint by 15° (or blocks at limits)', () => {
    const env = new RobotArmEnv(11);
    env.reset({ q0: 0, q1: 0, q2: 0 }); // far target: no accidental success
    env.setConfig({ q0: 6, q1: 2, q2: 2 }); // centre of every range

    env.step(0); // base-
    expect(env.angles.q0).toBeCloseTo(Q0_VALUES[5], 10);
    expect(env.angles.q1).toBeCloseTo(Q1_VALUES[2], 10);
    expect(env.angles.q2).toBeCloseTo(Q2_VALUES[2], 10);

    env.step(1); // base+ back
    env.step(3); // shoulder+
    expect(env.angles.q1).toBeCloseTo(Q1_VALUES[3], 10);
    env.step(2); // shoulder- back
    env.step(5); // elbow+
    expect(env.angles.q2).toBeCloseTo(Q2_VALUES[3], 10);
  });

  it('at a grid limit the command is a no-op and counts as blocked', () => {
    const env = new RobotArmEnv(11);
    env.reset({ q0: 6, q1: 2, q2: 2 });
    env.setConfig({ q0: 0, q1: 0, q2: 0 }); // lowest limit everywhere
    const tipBefore = { ...env.tip };
    env.step(0); // base- at min → blocked no-op
    expect(env.blockedLastCommand).toBe(1);
    expect(env.angles.q0).toBeCloseTo(Q0_VALUES[0], 10);
    expect(env.tip).toEqual(tipBefore);
    env.step(2); // shoulder- at min → blocked
    expect(env.blockedLastCommand).toBe(1);
    env.step(4); // elbow- at min → blocked
    expect(env.blockedLastCommand).toBe(1);
    expect(env.currentStats.blocked).toBe(3);
  });

  it('refuses to step a finished episode', () => {
    const env = new RobotArmEnv(11);
    env.reset({ q0: 6, q1: 4, q2: 4 });
    env.setConfig({ q0: 0, q1: 0, q2: 0 });
    for (let i = 0; i < MAX_COMMANDS; i++) env.step(i % 2 === 0 ? 0 : 1);
    expect(env.done()).toBe(true);
    expect(() => env.step(1)).toThrow(/finished episode/);
  });
});

describe('RobotArmEnv reward (exact contract formula)', () => {
  it('applies 2(d-d\')/1.6 - 0.02d\'/1.6 - 0.01 - 0.02·blocked + success', () => {
    const env = new RobotArmEnv(11);
    env.reset({ q0: 6, q1: 4, q2: 4 });
    env.setConfig({ q0: 6, q1: 0, q2: 0 });
    const target = env.targetPosition;
    const d = distance({ x: env.tip.x, y: env.tip.y, z: env.tip.z }, target);
    env.step(3); // shoulder+ : 15° → 30°
    const tipAfter = { x: env.tip.x, y: env.tip.y, z: env.tip.z };
    const dNext = distance(tipAfter, target);
    const success = dNext <= SUCCESS_DISTANCE ? 1 : 0;
    const expected = (2 * (d - dNext)) / 1.6 - (0.02 * dNext) / 1.6 - 0.01 - 0.02 * 0 + success;
    expect(env.reward()).toBeCloseTo(expected, 12);
    // idempotent: reading again returns the same value
    expect(env.reward()).toBeCloseTo(expected, 12);
  });

  it('subtracts 0.02 on blocked commands', () => {
    const env = new RobotArmEnv(11);
    env.reset({ q0: 6, q1: 2, q2: 2 });
    env.setConfig({ q0: 0, q1: 2, q2: 2 }); // base at min
    const d = distance({ x: env.tip.x, y: env.tip.y, z: env.tip.z }, env.targetPosition);
    env.step(0); // base- blocked
    const dNext = distance({ x: env.tip.x, y: env.tip.y, z: env.tip.z }, env.targetPosition);
    const success = dNext <= SUCCESS_DISTANCE ? 1 : 0;
    const expected = (2 * (d - dNext)) / 1.6 - (0.02 * dNext) / 1.6 - 0.01 - 0.02 + success;
    expect(env.reward()).toBeCloseTo(expected, 12);
  });

  it('adds the success bonus exactly when d\' <= 0.10 m', () => {
    const env = new RobotArmEnv(11);
    const target = { q0: 6, q1: 2, q2: 2 };
    env.reset(target);
    env.setConfig(target); // d = 0 (evaluation-style start, bypasses the >0.10 rule)
    env.step(1); // move one base step away: d' > 0.10, no success
    expect(env.terminated()).toBe(false);
    const dAway = distance({ x: env.tip.x, y: env.tip.y, z: env.tip.z }, env.targetPosition);
    expect(dAway).toBeGreaterThan(SUCCESS_DISTANCE);
    env.step(0); // come back: d' = 0 → success term = 1
    expect(env.terminated()).toBe(true);
    const expected = (2 * dAway) / 1.6 - 0.01 + 1;
    expect(env.reward()).toBeCloseTo(expected, 12);
  });

  it('FK is injective on the grid and some neighbours sit inside 0.10 m', () => {
    // measured fact: the closest pair of distinct grid configurations sits at
    // ~0.0752 m, so success (d' <= 0.10) can trigger on a near-neighbour
    // configuration — the task tolerates small spatial shortcuts.
    const configs = gridConfigs();
    let min = Number.POSITIVE_INFINITY;
    let closest: [unknown, unknown] | null = null;
    for (let i = 0; i < configs.length; i++) {
      for (let j = i + 1; j < configs.length; j++) {
        const d = distance(configToPosition(configs[i]), configToPosition(configs[j]));
        if (d < min) {
          min = d;
          closest = [configs[i], configs[j]];
        }
      }
    }
    expect(min).toBeGreaterThan(0); // FK injective on the grid
    expect(min).toBeLessThanOrEqual(SUCCESS_DISTANCE);
    expect(closest).not.toBeNull();
  });
});

describe('RobotArmEnv episodes and seeded reset', () => {
  it('truncates after 80 commands without success', () => {
    const env = new RobotArmEnv(11);
    env.reset({ q0: 6, q1: 4, q2: 4 });
    env.setConfig({ q0: 0, q1: 0, q2: 0 });
    // wiggle between two far configs, never reaching the target
    for (let i = 0; i < MAX_COMMANDS - 1; i++) {
      env.step(i % 2 === 0 ? 0 : 1);
      expect(env.truncated()).toBe(false);
      expect(env.done()).toBe(false);
    }
    env.step(1);
    expect(env.truncated()).toBe(true);
    expect(env.terminated()).toBe(false);
    expect(env.done()).toBe(true);
    expect(env.currentStats.commands).toBe(MAX_COMMANDS);
    // the stats snapshot mirrors the terminal semantics (used by measurement)
    expect(env.currentStats.truncated).toBe(true);
    expect(env.currentStats.success).toBe(false);
  });

  it('stats snapshot mirrors success semantics at every step', () => {
    const env = new RobotArmEnv(11);
    const target = { q0: 6, q1: 2, q2: 2 };
    env.reset(target);
    env.setConfig(target);
    env.step(1); // move away
    expect(env.currentStats.success).toBe(false);
    env.step(0); // back on target
    expect(env.currentStats.success).toBe(true);
    expect(env.currentStats.commandsToSuccess).toBe(2);
    expect(env.currentStats.truncated).toBe(false);
  });

  it('success at command 80 terminates without truncation', () => {
    const env = new RobotArmEnv(11);
    const target = { q0: 6, q1: 4, q2: 4 };
    env.reset(target);
    env.setConfig({ q0: 7, q1: 4, q2: 4 }); // one base step away, shoulder at max
    for (let i = 0; i < 79; i++) env.step(3); // shoulder+ at the limit: blocked no-ops
    expect(env.currentStats.commands).toBe(79);
    expect(env.currentStats.blocked).toBe(79);
    expect(env.truncated()).toBe(false);
    expect(env.terminated()).toBe(false);
    env.step(0); // 80th: lands exactly on the target config
    expect(env.currentStats.commands).toBe(80);
    expect(env.terminated()).toBe(true);
    expect(env.truncated()).toBe(false);
    expect(env.done()).toBe(true);
    expect(env.currentStats.commandsToSuccess).toBe(80);
  });

  it('seeded reset is deterministic and zeroes counters/reward', () => {
    const a = new RobotArmEnv(47);
    const b = new RobotArmEnv(47);
    for (let i = 0; i < 5; i++) {
      a.reset();
      b.reset();
      expect(a.config).toEqual(b.config);
      expect(a.targetPosition).toEqual(b.targetPosition);
    }
    a.step(1);
    a.step(3);
    expect(a.reward()).not.toBe(0);
    a.reset();
    expect(a.reward()).toBe(0);
    expect(a.currentStats.commands).toBe(0);
    expect(a.currentStats.return).toBe(0);
    expect(a.currentStats.blocked).toBe(0);
  });

  it('start is always strictly farther than 0.10 m from the target', () => {
    for (const seed of [11, 29, 47, 64, 101]) {
      const env = new RobotArmEnv(seed);
      for (let i = 0; i < 50; i++) {
        env.reset();
        const d = distance(env.targetPosition, { x: env.tip.x, y: env.tip.y, z: env.tip.z });
        expect(d).toBeGreaterThan(SUCCESS_DISTANCE);
      }
    }
  });

  it('targets are always reachable (FK of a valid config)', () => {
    const env = new RobotArmEnv(11);
    const configs = new Set(gridConfigs().map((c) => JSON.stringify(c)));
    for (let i = 0; i < 30; i++) {
      env.reset();
      expect(configs.has(JSON.stringify(env.targetConfigPosition))).toBe(true);
    }
  });

  it('rejects invalid seeds and target configs', () => {
    expect(() => new RobotArmEnv(0)).toThrow();
    expect(() => new RobotArmEnv(-3)).toThrow();
    const env = new RobotArmEnv(11);
    expect(() => env.reset({ q0: -1, q1: 0, q2: 0 })).toThrow(/invalid target/);
    expect(() => env.reset({ q0: 0, q1: 5, q2: 0 })).toThrow(/invalid target/);
    expect(() => env.setConfig({ q0: 0, q1: 0, q2: 99 })).toThrow(/invalid config/);
  });
});
