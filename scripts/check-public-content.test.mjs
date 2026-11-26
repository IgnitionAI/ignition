import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { findViolations } from './check-public-content.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-public-content.mjs');
// Forbidden strings are assembled at runtime so this test file stays clean for the guard.
const ticket = ['IGN', '42'].join('-');
const codeName = ['Hor', 'us'].join('');
const localPath = ['', 'Users', 'someone', 'dev'].join('/');
const logPath = ['evidence', ['ign', '7'].join('-'), 'run.txt'].join('/');

const repos = [];
function repo(files) {
  const dir = mkdtempSync(join(tmpdir(), 'public-content-'));
  repos.push(dir);
  execFileSync('git', ['init', '-q'], { cwd: dir });
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  execFileSync('git', ['add', '-A'], { cwd: dir });
  return dir;
}
const run = (dir) => spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });

afterEach(() => { while (repos.length) rmSync(repos.pop(), { recursive: true, force: true }); });

describe('check-public-content', () => {
  it('passes on clean tracked files', () => {
    const dir = repo({
      'README.md': '# Demo\nDesign notes, igniter-12 and Horusian are not matches.\n',
      'src/a.ts': 'export const DESIGN = "ign-version-2";\n',
    });
    expect(findViolations(dir)).toEqual([]);
    expect(run(dir).status).toBe(0);
  });

  it('fails on ticket ids, code names and local paths', () => {
    const dir = repo({
      'docs/a.md': `Done in ${ticket}.\n`,
      'docs/b.md': `ok\nreviewed by ${codeName.toLowerCase()}\n`,
      'src/c.ts': `const p = "${localPath}";\nconst q = "${logPath}";\n`,
    });
    const found = findViolations(dir).map((v) => `${v.file}:${v.line}:${v.rule}`).sort();
    expect(found).toEqual([
      'docs/a.md:1:private ticket identifier',
      'docs/b.md:2:internal code name',
      'src/c.ts:1:local machine path',
      'src/c.ts:2:local verification log path',
      'src/c.ts:2:private ticket identifier',
    ]);
    const res = run(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('5 violation(s)');
  });

  it('checks binary files for paths only and ignores untracked files', () => {
    const dir = repo({
      'img.bin': Buffer.concat([Buffer.from([0, 1, 2]), Buffer.from(`${ticket} ${localPath}`)]),
    });
    writeFileSync(join(dir, 'untracked.md'), `${ticket}\n`);
    const found = findViolations(dir);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ file: 'img.bin', line: null, rule: 'local machine path' });
  });
});
