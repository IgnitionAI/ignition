import { lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const availability = spawnSync('trash', ['--version'], { encoding: 'utf8' });
if (availability.error || availability.status !== 0) {
  console.error('Cleanup requires trash (trash-cli). Install it before running pnpm clean. No files were moved.');
  process.exit(1);
}

const targets = [];
for (const entry of readdirSync(join(root, 'packages'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  for (const name of ['dist', 'node_modules']) {
    const target = join(root, 'packages', entry.name, name);
    try {
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        console.error(`Refusing symlink cleanup target: ${target}. No files were moved.`);
        process.exit(1);
      }
      if (stat.isDirectory()) targets.push(target);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

if (targets.length === 0) {
  console.log('No package dist or node_modules directories to move.');
  process.exit(0);
}
console.log(`Moving package artifacts to Trash:\n${targets.join('\n')}`);
const result = spawnSync('trash', ['--', ...targets], { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
if (result.error || result.status !== 0) {
  console.error('Cleanup did not complete. Check Trash for any directories already moved.');
  process.exit(1);
}
console.log('Restore directories with trash-restore; keep their original paths.');
