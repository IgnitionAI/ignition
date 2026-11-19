import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const distIndex = join(repoRoot, 'packages/backend-tfjs/dist/index.js');
const rootTrainScript = join(repoRoot, 'scripts/train-ppo-nav1d.mjs');

describe('Node ESM load of built @ignitionai/backend-tfjs', () => {
  it('exposes the documented repo-root training script', () => {
    expect(existsSync(rootTrainScript)).toBe(true);
  });

  it('imports PPOAgent from dist/index.js without ERR_MODULE_NOT_FOUND', () => {
    expect(existsSync(distIndex), 'run `corepack pnpm --filter @ignitionai/backend-tfjs build` first').toBe(
      true,
    );
    const stdout = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { PPOAgent } from ${JSON.stringify(distIndex)};
         if (typeof PPOAgent !== 'function') {
           throw new Error('PPOAgent is not a constructor');
         }
         console.log('PPOAgent_ok');`,
      ],
      { encoding: 'utf8', cwd: repoRoot },
    );
    expect(stdout).toContain('PPOAgent_ok');
  });
});
