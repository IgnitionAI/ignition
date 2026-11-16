#!/usr/bin/env node
/**
 * Verify markdown relative links in each skill folder stay inside that folder,
 * except links that resolve to packages/ (framework sources).
 *
 * Usage (from repo root): node skills/check-relative-links.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(skillsRoot, '..');
const packagesRoot = join(repoRoot, 'packages');
const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

function isInside(child, parent) {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !rel.startsWith('..'));
}

function skillDirs() {
  return readdirSync(skillsRoot)
    .filter((name) => name.startsWith('ignition-'))
    .map((name) => join(skillsRoot, name))
    .filter((path) => statSync(path).isDirectory());
}

function markdownFiles(skillDir) {
  const files = [join(skillDir, 'SKILL.md')];
  const refs = join(skillDir, 'references');
  if (existsSync(refs) && statSync(refs).isDirectory()) {
    for (const name of readdirSync(refs)) {
      if (name.endsWith('.md')) {
        files.push(join(refs, name));
      }
    }
  }
  return files.filter((file) => existsSync(file));
}

let failed = false;
let checked = 0;

for (const skillDir of skillDirs()) {
  const skillName = skillDir.split(sep).pop();
  for (const file of markdownFiles(skillDir)) {
    const text = readFileSync(file, 'utf8');
    const matches = [...text.matchAll(LINK_RE)];
    if (matches.length === 0) {
      process.stdout.write(`OK  ${skillName}/${relative(skillDir, file)} (no markdown links)\n`);
      continue;
    }
    for (const match of matches) {
      let href = match[2].trim().replace(/\s+"[^"]*"$/, '').replace(/\s+'[^']*'$/, '');
      if (
        href === '' ||
        href.startsWith('#') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:')
      ) {
        process.stdout.write(`OK  ${skillName}/${relative(skillDir, file)} -> ${href}\n`);
        checked += 1;
        continue;
      }
      const pathPart = href.split('#')[0];
      if (pathPart === '') {
        process.stdout.write(`OK  ${skillName}/${relative(skillDir, file)} -> ${href}\n`);
        checked += 1;
        continue;
      }
      const resolved = resolve(dirname(file), pathPart);
      const relFile = `${skillName}/${relative(skillDir, file)}`;
      if (isInside(resolved, skillDir)) {
        if (!existsSync(resolved)) {
          process.stdout.write(`FAIL ${relFile} -> ${href} (missing in-skill target)\n`);
          failed = true;
        } else {
          process.stdout.write(`OK  ${relFile} -> ${href}\n`);
        }
        checked += 1;
        continue;
      }
      if (isInside(resolved, packagesRoot)) {
        process.stdout.write(`OK  ${relFile} -> ${href} (framework source)\n`);
        checked += 1;
        continue;
      }
      process.stdout.write(
        `FAIL ${relFile} -> ${href} leaves skill folder (${relative(repoRoot, resolved)})\n`,
      );
      failed = true;
      checked += 1;
    }
  }
}

process.stdout.write(`checked=${checked} failed=${failed ? 'yes' : 'no'}\n`);
process.exit(failed ? 1 : 0);
