import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({ resolve: { alias: { 'react': source('./node_modules/react'), '@': source('../web'),
    '@ignitionai/backend-tfjs': source('../backend-tfjs/src/index.ts'), '@ignitionai/core': source('../core/src/index.ts'),
    '@ignitionai/storage': source('../storage/src/index.ts') } },
  esbuild: { jsx: 'automatic' }, test: { environment: 'node', include: ['test/**/*.test.ts', 'src/visual/**/*.test.ts'],
    maxWorkers: 1, minWorkers: 1, fileParallelism: false, cache: false } });
