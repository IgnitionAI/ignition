import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('SKILL.md frontmatter matches Agent Skills conventions', () => {
  const raw = readFileSync(
    resolve(process.cwd(), 'skills/ignition-debug-training/SKILL.md'),
    'utf8',
  );
  const end = raw.indexOf('\n---\n', 4);
  const front = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const name = /(?:^|\n)name:\s*(.+)/.exec(front)?.[1]?.trim();
  const description = /(?:^|\n)description:\s*(.+)/.exec(front)?.[1]?.trim();
  expect(name).toBe('ignition-debug-training');
  expect(description!.length).toBeLessThanOrEqual(1024);
  expect(body.split(/\r?\n/).length).toBeLessThanOrEqual(500);
});
