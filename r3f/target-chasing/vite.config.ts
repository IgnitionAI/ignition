import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // tfjs-node est node-only (fs/binding natif) : jamais exécuté en navigateur,
      // mais le scanner Vite suit le require() littéral de backend-selector.
      '@tensorflow/tfjs-node': path.resolve(__dirname, './src/shims/tfjs-node.ts'),
      '@ignitionai/backend-tfjs': path.resolve(__dirname, '../../packages/backend-tfjs/src'),
      '@ignitionai/core': path.resolve(__dirname, '../../packages/core/src')
    }
  }
})
