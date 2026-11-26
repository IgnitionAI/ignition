import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { rl2CurvesPlugin } from './scripts/rl2-curves.mjs';
import { RL2_BENCHES } from './src/rl2/benches';

export default defineConfig({
  root: 'src',
  // Website build: build-demos.mjs sets DEMO_BASE=/demos/target-chasing/.
  base: process.env.DEMO_BASE ?? '/',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
        ppo: path.resolve(__dirname, 'src/ppo.html'),
        'dqn-vs-double': path.resolve(__dirname, 'src/dqn-vs-double.html'),
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
  plugins: [
    react(),
    // Light per-bin aggregate of the RL 2 episode logs; the raw JSONL stays the source.
    rl2CurvesPlugin({ publicDir: path.resolve(__dirname, 'public'), benchDirs: RL2_BENCHES.map((b) => b.dir) }),
  ],
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
