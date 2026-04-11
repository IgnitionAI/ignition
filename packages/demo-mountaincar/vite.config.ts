import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  build: { outDir: '../dist' },
  server: { port: 3003 },
  plugins: [react()],
  resolve: {
    alias: {
      '@ignitionai/backend-tfjs': path.resolve(__dirname, '../backend-tfjs/src'),
      '@ignitionai/core': path.resolve(__dirname, '../core/src'),
      '@tensorflow/tfjs-node': '@tensorflow/tfjs',
    },
  },
  optimizeDeps: { exclude: ['@tensorflow/tfjs-node'] },
});
