import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TrainingEnv } from '@ignitionai/core';
import { validateTrainingEnv } from '@ignitionai/core';
import { MountainCarEnv } from '@ignitionai/environments';
import {
  MOUNTAIN_CAR_COMPARISON,
  MOUNTAIN_CAR_GOAL_POS,
  MountainCarTerminalWrapper,
  RewardShapingWrapper,
  compareMountainCarRewards,
  mountainCarReachedFlag,
} from './skill-reward-shaping';

class ScriptedEnv implements TrainingEnv {
  actions = ['stay', 'go'];
  position: number;
  lastReward = 0;
  private readonly terminalAt: number;

  constructor(start: number, terminalAt = 10) {
    this.position = start;
    this.terminalAt = terminalAt;
  }

  observe(): number[] {
    return [this.position];
  }

  step(action: number | number[]): void {
    const a = typeof action === 'number' ? action : action[0];
    this.position += a === 1 ? 1 : 0;
    this.lastReward = -1;
  }

  reward(): number {
    return this.lastReward;
  }

  done(): boolean {
    return this.position >= this.terminalAt;
  }

  reset(): void {
    this.position = 0;
    this.lastReward = 0;
  }
}

describe('ignition-reward-shaping frontmatter', () => {
  it('name matches folder, description ≤ 1024, body ≤ 500 lines', () => {
    const skillPath = resolve(process.cwd(), 'skills/ignition-reward-shaping/SKILL.md');
    const raw = readFileSync(skillPath, 'utf8');
    expect(raw.startsWith('---')).toBe(true);
    const end = raw.indexOf('\n---', 3);
    expect(end).toBeGreaterThan(0);
    const frontmatter = raw.slice(4, end);
    const body = raw.slice(end + 4).replace(/^\n/, '');
    const name = /(?:^|\n)name:\s*(.+)/.exec(frontmatter)?.[1]?.trim();
    const description = /(?:^|\n)description:\s*(.+)/.exec(frontmatter)?.[1]?.trim();
    expect(name).toBe('ignition-reward-shaping');
    expect(description).toBeDefined();
    expect(description!.length).toBeGreaterThan(0);
    expect(description!.length).toBeLessThanOrEqual(1024);
    expect(body.split('\n').length).toBeLessThanOrEqual(500);
  });
});

describe('RewardShapingWrapper hand-calculated transitions', () => {
  it('adds F = γ Φ(s′) − Φ(s) to a scripted inner reward', () => {
    const inner = new ScriptedEnv(2);
    const wrapped = new RewardShapingWrapper(inner, {
      gamma: 0.99,
      potential: (obs) => obs[0],
      zeroPotentialOnTerminate: false,
    });
    validateTrainingEnv(wrapped);
    expect(inner.reward()).toBe(0);
    wrapped.step(1);
    // s=2 → s′=3, inner r=-1, F=0.99*3-2=0.97 → r′=-0.03
    expect(inner.position).toBe(3);
    expect(inner.reward()).toBe(-1);
    expect(wrapped.reward()).toBeCloseTo(-1 + 0.99 * 3 - 2, 12);
  });

  it('applies scale and time penalty on the same transition', () => {
    const inner = new ScriptedEnv(2);
    const wrapped = new RewardShapingWrapper(inner, {
      gamma: 0.99,
      potential: (obs) => obs[0],
      scale: 2,
      timePenalty: -0.1,
      zeroPotentialOnTerminate: false,
    });
    wrapped.step(1);
    // 2*(-1) + (0.99*3-2) + (-0.1) = -2 + 0.97 - 0.1 = -1.13
    expect(wrapped.reward()).toBeCloseTo(-1.13, 12);
  });

  it('sign flip (scale=-1) inverts the inner term only', () => {
    const inner = new ScriptedEnv(2);
    const wrapped = new RewardShapingWrapper(inner, {
      gamma: 0.99,
      potential: (obs) => obs[0],
      scale: -1,
      zeroPotentialOnTerminate: false,
    });
    wrapped.step(1);
    // -1*(-1) + 0.97 = 1.97
    expect(wrapped.reward()).toBeCloseTo(1.97, 12);
  });

  it('zeros Φ(s′) on a true terminal', () => {
    const inner = new ScriptedEnv(9, 10);
    const wrapped = new RewardShapingWrapper(inner, {
      gamma: 0.99,
      potential: (obs) => obs[0],
      zeroPotentialOnTerminate: true,
      terminated: (env) => (unwrapScripted(env).position >= 10),
    });
    wrapped.step(1);
    expect(inner.position).toBe(10);
    expect(wrapped.terminated()).toBe(true);
    // F = 0.99*0 - 9 = -9, r′ = -1 - 9 = -10
    expect(wrapped.reward()).toBeCloseTo(-10, 12);
  });

  it('matches MountainCar physics from (position,velocity)=(0,0) with action 2', () => {
    const inner = new MountainCarEnv();
    inner.position = 0;
    inner.velocity = 0;
    inner.stepCount = 0;
    const wrapped = new RewardShapingWrapper(inner, {
      gamma: 0.99,
      potential: (obs) => obs[0],
      zeroPotentialOnTerminate: false,
    });
    wrapped.step(2);
    // force=(2-1)*0.001=0.001; vel=0.001-0.0025*cos(0)=-0.0015; pos=-0.0015
    expect(inner.position).toBeCloseTo(-0.0015, 12);
    expect(inner.velocity).toBeCloseTo(-0.0015, 12);
    expect(inner.reward()).toBe(-1);
    // F=0.99*(-0.0015)-0=-0.001485 → r′=-1.001485
    expect(wrapped.reward()).toBeCloseTo(-1.001485, 12);
    expect(mountainCarReachedFlag(inner)).toBe(false);
  });

  it('goal transition on MountainCar uses Φ(s′)=0 and does not use timeout as success', () => {
    const inner = new MountainCarEnv();
    inner.position = 0.499;
    inner.velocity = 0.07;
    inner.stepCount = 0;
    const terminals = new MountainCarTerminalWrapper(inner);
    const wrapped = new RewardShapingWrapper(terminals, {
      gamma: 0.99,
      potential: (obs) => obs[0],
      zeroPotentialOnTerminate: true,
    });
    wrapped.step(2);
    // vel clamped 0.07; pos=0.499+0.07=0.569 ≥ 0.5
    expect(inner.position).toBeCloseTo(0.569, 12);
    expect(inner.position).toBeGreaterThanOrEqual(MOUNTAIN_CAR_GOAL_POS);
    expect(wrapped.terminated()).toBe(true);
    expect(wrapped.truncated()).toBe(false);
    expect(mountainCarReachedFlag(inner)).toBe(true);
    // F=0.99*0-0.499=-0.499 → r′=-1.499
    expect(wrapped.reward()).toBeCloseTo(-1.499, 12);
  });
});

function unwrapScripted(env: TrainingEnv): ScriptedEnv {
  let current: TrainingEnv = env;
  while (current instanceof RewardShapingWrapper) {
    current = current.innerEnv();
  }
  return current as ScriptedEnv;
}

describe('MountainCar sparse vs shaped (true flag successes)', () => {
  it('runs the declared 3-seed budget and reports flag counts without claiming a winner', async () => {
    expect(MOUNTAIN_CAR_COMPARISON.seeds).toHaveLength(3);
    const report = await compareMountainCarRewards();
    expect(report.rows).toHaveLength(6);
    for (const row of report.rows) {
      expect(row.episodes).toBe(MOUNTAIN_CAR_COMPARISON.episodesPerSeed);
      expect(row.flagSuccesses + row.timeouts).toBe(row.episodes);
      expect(row.flagSuccesses).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(row.sumReportedReward)).toBe(true);
    }
    const sparseFlags = report.rows.filter((r) => r.variant === 'sparse').map((r) => r.flagSuccesses);
    const shapedFlags = report.rows.filter((r) => r.variant === 'shaped').map((r) => r.flagSuccesses);
    console.log('[skill-reward-shaping] flagSuccesses sparse', sparseFlags, 'shaped', shapedFlags);
  }, 55_000);
});
