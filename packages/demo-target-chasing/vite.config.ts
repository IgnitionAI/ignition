import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
        ppo: path.resolve(__dirname, 'src/ppo.html'),
      },
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
      '@ignitionai/storage': path.resolve(__dirname, '../storage/src'),
      '@tensorflow/tfjs': path.resolve(__dirname, '../backend-tfjs/node_modules/@tensorflow/tfjs'),
      // Redirect tfjs-node to tfjs (browser-only) to avoid Node.js native deps
      '@tensorflow/tfjs-node': '@tensorflow/tfjs',
    },
  },
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs-node'],
  },
});
