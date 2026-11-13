import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
export default defineConfig({ resolve: { alias: { 'react': fileURLToPath(new URL('./node_modules/react', import.meta.url)), '@': fileURLToPath(new URL('../web', import.meta.url)) } },
  esbuild: { jsx: 'automatic' }, test: { environment: 'node', include: ['test/**/*.test.ts', 'src/visual/**/*.test.ts'],
    maxWorkers: 1, minWorkers: 1, fileParallelism: false, cache: false } });
