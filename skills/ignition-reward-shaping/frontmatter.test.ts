import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('skills/ignition-reward-shaping SKILL.md', () => {
  it('has valid Agent Skill frontmatter', () => {
    const skillPath = resolve(dirname(fileURLToPath(import.meta.url)), 'SKILL.md');
    const raw = readFileSync(skillPath, 'utf8');
    const end = raw.indexOf('\n---', 3);
    const frontmatter = raw.slice(4, end);
    const body = raw.slice(end + 4).replace(/^\n/, '');
    const name = /(?:^|\n)name:\s*(.+)/.exec(frontmatter)?.[1]?.trim();
    const description = /(?:^|\n)description:\s*(.+)/.exec(frontmatter)?.[1]?.trim();
    expect(name).toBe('ignition-reward-shaping');
    expect(description?.length ?? 0).toBeGreaterThan(0);
    expect(description!.length).toBeLessThanOrEqual(1024);
    expect(body.split('\n').length).toBeLessThanOrEqual(500);
  });
});
