import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.DEMO_BASE ?? '/',
  plugins: [react()],
  resolve: { alias: {
    '@ignitionai/backend-tfjs': path.resolve(__dirname, '../backend-tfjs/src'),
    '@ignitionai/core': path.resolve(__dirname, '../core/src'),
    '@ignitionai/storage': path.resolve(__dirname, '../storage/src'),
    '@tensorflow/tfjs-node': '@tensorflow/tfjs',
  } },
  optimizeDeps: { exclude: ['@tensorflow/tfjs-node'] },
});
