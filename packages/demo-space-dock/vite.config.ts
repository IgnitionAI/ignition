import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Same source aliases as demo-ball-thrust: workspace packages ship no dist in this repository.
const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  base: process.env.DEMO_BASE ?? '/',
  plugins: [react()],
  resolve: { alias: {
    '@ignitionai/backend-tfjs': source('../backend-tfjs/src'),
    '@ignitionai/core': source('../core/src'),
    '@ignitionai/storage': source('../storage/src'),
    '@tensorflow/tfjs-node': '@tensorflow/tfjs',
  } },
  optimizeDeps: { exclude: ['@tensorflow/tfjs-node'] },
});
