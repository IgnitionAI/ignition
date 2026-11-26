#!/usr/bin/env node
/**
 * Public content guard.
 *
 * Fails when a file tracked by git contains an internal work reference:
 * private ticket identifiers, local verification log paths, local machine
 * paths or internal team code names. Run from the repository root:
 *
 *   node scripts/check-public-content.mjs
 *
 * Text files are checked against every rule. Binary files (a NUL byte in the
 * first 8 KiB) are only checked against the path rules: their compressed data
 * would make the short word rules produce random false positives, while image
 * metadata can still leak a local path.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const INTERNAL_NAMES = [
  'Khayon', 'Lucius', 'Talos', 'Abaddon', 'Fulgrim', 'Horus',
  'Bequa', 'Honsou', 'Ahriman', 'Kairos', 'Fabius', 'Argel',
];

/** Rules applied to text and binary files. */
export const PATH_RULES = [
  { name: 'local verification log path', re: /evidence\/ign-/i },
  { name: 'local verification log path', re: /proofs\//i },
  { name: 'local machine path', re: /\/Users\/[a-z]/ },
  { name: 'local machine path', re: /\/data\/OpenBot/i },
];

/** Rules applied to text files only. */
export const TEXT_RULES = [
  { name: 'private ticket identifier', re: /\bIGN-[0-9]+\b/i },
  { name: 'internal code name', re: new RegExp(`\\b(?:${INTERNAL_NAMES.join('|')})\\b`, 'i') },
];

/**
 * Paths never scanned, relative to the repository root: this guard holds the
 * rules themselves. The lockfile is scanned too (no false positive today).
 */
export const EXCLUDED_PATHS = new Set([
  'scripts/check-public-content.mjs',
]);

const MAX_BYTES = 20 * 1024 * 1024;

function isBinary(buf) {
  const end = Math.min(buf.length, 8192);
  for (let i = 0; i < end; i++) if (buf[i] === 0) return true;
  return false;
}

export function listTrackedFiles(cwd) {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd, maxBuffer: 64 * 1024 * 1024 });
  return out.toString('utf8').split('\0').filter(Boolean);
}

/**
 * Scans the tracked files of the git repository at `cwd`.
 * Returns one entry per (file, line, rule) violation.
 */
export function findViolations(cwd = process.cwd()) {
  const violations = [];
  for (const file of listTrackedFiles(cwd)) {
    if (EXCLUDED_PATHS.has(file)) continue;
    const abs = join(cwd, file);
    let st;
    try { st = statSync(abs); } catch { continue; } // deleted in the working tree
    if (!st.isFile() || st.size > MAX_BYTES) continue;
    const buf = readFileSync(abs);
    const binary = isBinary(buf);
    const rules = binary ? PATH_RULES : [...PATH_RULES, ...TEXT_RULES];
    const lines = buf.toString(binary ? 'latin1' : 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const rule of rules) {
        const m = rule.re.exec(line);
        if (m) violations.push({ file, line: binary ? null : i + 1, rule: rule.name, match: m[0] });
      }
    });
  }
  return violations;
}

function main() {
  const cwd = resolve(process.argv[2] ?? process.cwd());
  const violations = findViolations(cwd);
  if (violations.length === 0) {
    console.log('check-public-content: OK');
    return;
  }
  for (const v of violations) {
    console.error(`${v.file}${v.line ? `:${v.line}` : ''}: ${v.rule} (${v.match})`);
  }
  console.error(`check-public-content: ${violations.length} violation(s).`);
  process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
