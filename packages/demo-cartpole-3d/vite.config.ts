import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  base: process.env.DEMO_BASE ?? '/',
  build: { outDir: '../dist', emptyOutDir: true },
  server: { port: 3010 },
  plugins: [react()],
  resolve: {
    alias: {
      '@ignitionai/backend-tfjs': path.resolve(__dirname, '../backend-tfjs/src'),
      '@ignitionai/core': path.resolve(__dirname, '../core/src'),
      '@ignitionai/environments': path.resolve(__dirname, '../environments/src'),
      '@tensorflow/tfjs-node': '@tensorflow/tfjs',
    },
  },
  optimizeDeps: { exclude: ['@tensorflow/tfjs-node'] },
});
