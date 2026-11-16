import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const skillDir = dirname(fileURLToPath(import.meta.url));
const folderName = 'ignition-export-onnx';
const skillPath = join(skillDir, 'SKILL.md');

function parseFrontmatter(source: string): { name: string; description: string; body: string } {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('SKILL.md must start with YAML frontmatter');
  }
  const yaml = match[1];
  const body = match[2];
  const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = yaml.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !description) {
    throw new Error('frontmatter requires name and description');
  }
  return { name, description, body };
}

describe('ignition-export-onnx frontmatter', () => {
  it('name matches folder, description <= 1024, body <= 500 lines', () => {
    const source = readFileSync(skillPath, 'utf8');
    const { name, description, body } = parseFrontmatter(source);
    const bodyLines = body.split('\n').length;
    expect(name).toBe(folderName);
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(1024);
    expect(bodyLines).toBeLessThanOrEqual(500);
  });
});
