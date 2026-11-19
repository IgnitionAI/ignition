import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

describe('ignition-save-load SKILL.md', () => {
  it('frontmatter name matches the folder, description ≤ 1024 chars, body ≤ 500 lines', () => {
    const skillPath = join(dirname(fileURLToPath(import.meta.url)), 'SKILL.md');
    const raw = readFileSync(skillPath, 'utf8');
    expect(raw.startsWith('---\n')).toBe(true);
    const closing = raw.indexOf('\n---\n', 4);
    expect(closing).toBeGreaterThan(0);
    const frontmatter = raw.slice(4, closing);
    const body = raw.slice(closing + 5);
    const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
    expect(name).toBe('ignition-save-load');
    expect(description).toBeDefined();
    expect(description!.length).toBeGreaterThan(0);
    expect(description!.length).toBeLessThanOrEqual(1024);
    const bodyLines = body.split(/\r?\n/).length;
    expect(bodyLines).toBeLessThanOrEqual(500);
    console.log(JSON.stringify({
      name,
      descriptionLength: description!.length,
      bodyLines,
    }));
  });
});
