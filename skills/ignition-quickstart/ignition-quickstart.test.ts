import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const skillDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(skillDir, '../..');

function parseFrontmatter(markdown: string): { name: string; description: string; body: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('SKILL.md is missing YAML frontmatter');
  }
  const frontmatter = match[1];
  const body = match[2];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const descriptionBlock = frontmatter.match(/^description:\s*(?:\|>-?|>-?|)?\s*([\s\S]*?)(?=^[a-zA-Z0-9_-]+:|\s*$)/m);
  const description = (descriptionBlock?.[1] ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s{2,}/, '').trim())
    .filter((line, index, lines) => !(index === lines.length - 1 && line.length === 0))
    .join(' ')
    .trim();
  if (!name) {
    throw new Error('frontmatter is missing name');
  }
  return { name, description, body };
}

describe('ignition-quickstart skill artifacts', () => {
  it('has valid Agent Skill frontmatter and size limits', () => {
    const markdown = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');
    const { name, description, body } = parseFrontmatter(markdown);
    expect(name).toBe('ignition-quickstart');
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(1024);
    expect(body.split(/\r?\n/).length).toBeLessThanOrEqual(500);
  });

  it('indexes exactly the nine published skills', () => {
    const readme = readFileSync(join(repoRoot, 'skills/README.md'), 'utf8');
    const expected = [
      'skills/ignition-quickstart/',
      'skills/ignition-create-env/',
      'skills/ignition-train/',
      'skills/ignition-train-infer-split/',
      'skills/ignition-reward-shaping/',
      'skills/ignition-debug-training/',
      'skills/ignition-evaluate/',
      'skills/ignition-export-onnx/',
      'skills/ignition-save-load/',
    ];
    const listed = [...new Set(readme.match(/skills\/ignition-[a-z-]+\//g) ?? [])].sort();
    expect(listed).toEqual([...expected].sort());
    expect(listed).toHaveLength(9);
  });
});
