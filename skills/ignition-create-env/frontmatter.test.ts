import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const skillDir = dirname(fileURLToPath(import.meta.url));
const folderName = 'ignition-create-env';

function parseSkill(): { name: string; description: string; bodyLines: number } {
  const text = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('SKILL.md must start with YAML frontmatter');
  const frontmatter = match[1];
  const body = match[2];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !description) throw new Error('frontmatter requires name and description');
  return {
    name,
    description,
    bodyLines: body.replace(/\n$/, '').split('\n').length,
  };
}

describe('ignition-create-env frontmatter', () => {
  it('matches the folder name, caps description at 1024 chars, and body at 500 lines', () => {
    const skill = parseSkill();
    expect(skill.name).toBe(folderName);
    expect(skill.description.length).toBeGreaterThan(0);
    expect(skill.description.length).toBeLessThanOrEqual(1024);
    expect(skill.bodyLines).toBeLessThanOrEqual(500);
  });
});
