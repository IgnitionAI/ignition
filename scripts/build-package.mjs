import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const compiler = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
const config = join(process.cwd(), 'tsconfig.json');
for (const options of [[], ['--module', 'CommonJS', '--outDir', 'dist/cjs', '--incremental', 'false', '--composite', 'false']]) {
  const result = spawnSync(process.execPath, [compiler, '--project', config, ...options], { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
const commonjs = join(process.cwd(), 'dist/cjs');
mkdirSync(commonjs, { recursive: true });
writeFileSync(join(commonjs, 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n');
