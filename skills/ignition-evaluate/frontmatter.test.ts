import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const skillDir = dirname(fileURLToPath(import.meta.url));
const folderName = 'ignition-evaluate';
const skillPath = join(skillDir, 'SKILL.md');

describe('ignition-evaluate SKILL.md frontmatter', () => {
  it('has name equal to the folder, description ≤ 1024 chars, body ≤ 500 lines', () => {
    const source = readFileSync(skillPath, 'utf8');
    expect(source.startsWith('---\n')).toBe(true);
    const end = source.indexOf('\n---\n', 4);
    expect(end).toBeGreaterThan(0);
    const frontmatter = source.slice(4, end);
    const body = source.slice(end + 5);
    const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
    expect(name).toBe(folderName);
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(0);
    expect(description!.length).toBeLessThanOrEqual(1024);
    expect(body.split('\n').length).toBeLessThanOrEqual(500);
  });
});
