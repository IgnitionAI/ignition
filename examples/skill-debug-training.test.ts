import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REJECTED_LR,
  SEEDS,
  TRAIN_LR,
  TRAIN_STEPS,
  measureTensorStability,
  runDeclaredProtocol,
  tryRejectedLearningRate,
} from './skill-debug-training';

describe('skill ignition-debug-training', () => {
  it('rejects Protocol A lr >= 1 before any training', () => {
    const message = tryRejectedLearningRate();
    expect(REJECTED_LR).toBe(1);
    expect(message).toMatch(/lr must be < 1/);
  });

  it('keeps TensorFlow.js tensor count flat after DQN warmup', async () => {
    const { before, after, delta } = await measureTensorStability(SEEDS[0]);
    expect(before).toBeGreaterThan(0);
    expect(after).toBe(before);
    expect(delta).toBe(0);
  });

  it('reproduces flat CartPole reward on 3 seeds and restores a non-zero return after the fix', async () => {
    const { broken, fixed } = await runDeclaredProtocol();
    console.log(JSON.stringify({ broken, fixed }, null, 2));

    expect(broken).toHaveLength(SEEDS.length);
    expect(fixed).toHaveLength(SEEDS.length);
    expect(TRAIN_STEPS).toBe(64);
    expect(TRAIN_LR).toBe(0.001);

    for (const row of broken) {
      expect(row.rewardMode).toBe('zero');
      expect(row.meanReturn).toBe(0);
      expect(row.finiteRewards).toBe(true);
    }

    for (const row of fixed) {
      expect(row.rewardMode).toBe('cartpole');
      expect(row.meanReturn).toBeGreaterThan(0);
      expect(row.qFinite, `seed ${row.seed} Q ${row.qSample}`).toBe(true);
      expect(row.finiteRewards).toBe(true);
      expect(row.finiteObservations).toBe(true);
    }
  });
});

describe('skills/ignition-debug-training frontmatter', () => {
  it('has name = folder, description <= 1024, body <= 500 lines', () => {
    const raw = readFileSync(
      resolve(__dirname, '../skills/ignition-debug-training/SKILL.md'),
      'utf8',
    );
    expect(raw.startsWith('---\n')).toBe(true);
    const end = raw.indexOf('\n---\n', 4);
    expect(end).toBeGreaterThan(0);
    const front = raw.slice(4, end);
    const body = raw.slice(end + 5);
    const name = /(?:^|\n)name:\s*(.+)/.exec(front)?.[1]?.trim();
    const description = /(?:^|\n)description:\s*(.+)/.exec(front)?.[1]?.trim();
    expect(name).toBe('ignition-debug-training');
    expect(description).toBeDefined();
    expect(description!.length).toBeGreaterThan(0);
    expect(description!.length).toBeLessThanOrEqual(1024);
    expect(body.split(/\r?\n/).length).toBeLessThanOrEqual(500);
  });
});
