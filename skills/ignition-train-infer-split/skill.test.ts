import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRAIN_INFER_SPLIT_BUDGET } from '../../examples/skill-train-infer-split';

const SKILL_DIR = 'ignition-train-infer-split';
const SKILL_PATH = resolve('skills', SKILL_DIR, 'SKILL.md');

function parseFrontmatter(source: string): { name: string; description: string; bodyLines: number } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('SKILL.md must start with YAML frontmatter delimited by ---');
  }
  const yaml = match[1];
  const body = match[2];
  const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const descriptionRaw = yaml.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !descriptionRaw) {
    throw new Error('frontmatter must include name and description');
  }
  const description = descriptionRaw.replace(/^['"]|['"]$/g, '');
  return { name, description, bodyLines: body.split(/\r?\n/).length };
}

describe('ignition-train-infer-split skill document', () => {
  it('has valid Agent Skills frontmatter and a short body', () => {
    const parsed = parseFrontmatter(readFileSync(SKILL_PATH, 'utf8'));
    expect(parsed.name).toBe(SKILL_DIR);
    expect(parsed.description.length).toBeGreaterThan(0);
    expect(parsed.description.length).toBeLessThanOrEqual(1024);
    expect(parsed.bodyLines).toBeLessThanOrEqual(500);
  });

  it('declares a multi-seed measurement budget for the executable example', () => {
    expect(TRAIN_INFER_SPLIT_BUDGET.seeds.length).toBeGreaterThanOrEqual(3);
  });
});
