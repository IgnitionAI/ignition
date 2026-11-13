import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';
import { it, expect } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const outRoot = join(repoRoot, 'packages/demo-target-chasing/public/ppo');
const trainScript = join(repoRoot, 'scripts/train-ppo-nav1d.mjs');

it.skipIf(!process.env.RUN_PPO_TRAIN)(
  'trains the frozen nav1d PPO budget via node scripts/train-ppo-nav1d.mjs',
  () => {
    const stdout = execFileSync(process.execPath, [trainScript], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    const manifest = JSON.parse(readFileSync(join(outRoot, 'manifest.json'), 'utf8')) as {
      gitSha: string;
      gitShaRule: string;
      seeds: number[];
      selectedSeed: number;
    };
    const head = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
    expect(manifest.gitSha).toBe(head);
    expect(manifest.gitShaRule).toMatch(/first parent/);
    expect(manifest.seeds).toEqual([11, 29, 47]);
    expect([11, 29, 47]).toContain(manifest.selectedSeed);
    expect(existsSync(join(outRoot, `seed-${manifest.selectedSeed}`, 'trained', 'model.json'))).toBe(true);
    console.log(stdout);
  },
  120_000,
);
