import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
const store = resolve('node_modules/.pnpm');
export default defineConfig({
  resolve: { alias: [{ find: /^three(\/.*)?$/, replacement: `${store}/three@0.162.0/node_modules/three$1` }] },
  test: { cache: false, environment: 'node', include: ['packages/demo-space-dock/src/visual/**/*.test.ts'] },
});
