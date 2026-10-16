import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ignitionai/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@ignitionai/backend-tfjs': resolve(__dirname, 'packages/backend-tfjs/src/index.ts'),
      '@ignitionai/backend-onnx': resolve(__dirname, 'packages/backend-onnx/src/index.ts'),
      '@ignitionai/storage': resolve(__dirname, 'packages/storage/src/index.ts'),
      '@ignitionai/environments': resolve(__dirname, 'packages/environments/src/index.ts'),
      '@ignitionai/ignitionai': resolve(__dirname, 'packages/ignitionai/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '**/test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        'packages/web/**',
      ]
    }
  },
});
