import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const modelsDir = fileURLToPath(new URL('../../public/models/', import.meta.url));

export function readModelBytes(name: string): Buffer {
  return readFileSync(join(modelsDir, `${name}.glb`));
}

export function writeVisualProof(filename: string, contents: string): void {
  const dir = join(tmpdir(), 'demo-space-dock-visual-proofs');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), contents);
}
