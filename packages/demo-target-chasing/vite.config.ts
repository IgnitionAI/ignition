import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      external: [
        '@tensorflow/tfjs-node',
        'fs',
        'path',
      ],
    },
  },
  server: {
    port: 3000,
  },
  define: {
    'process.env.VITE_HF_TOKEN': JSON.stringify(process.env.VITE_HF_TOKEN ?? ''),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@ignitionai/backend-tfjs': path.resolve(__dirname, '../backend-tfjs/src'),
      '@ignitionai/core': path.resolve(__dirname, '../core/src'),
      // Redirect tfjs-node to tfjs (browser-only) to avoid Node.js native deps
      '@tensorflow/tfjs-node': '@tensorflow/tfjs',
    },
  },
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs-node'],
  },
});
