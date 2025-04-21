import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ignitionai/backend-tfjs': path.resolve(__dirname, '../../packages/backend-tfjs/src'),
      '@ignitionai/core': path.resolve(__dirname, '../../packages/core/src')
    }
  }
})
