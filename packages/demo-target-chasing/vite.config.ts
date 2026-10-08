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
<<<<<<< HEAD
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
=======
    resolve: {
      alias: {
        // tfjs-node est node-only (fs/binding natif) : jamais exécuté en navigateur,
        // mais le scanner Vite suit le require() littéral de backend-selector.
        '@tensorflow/tfjs-node': path.resolve(__dirname, './src/shims/tfjs-node.ts'),
        '@ignitionai/backend-tfjs': path.resolve(__dirname, '../backend-tfjs/src'),
        '@ignitionai/core': path.resolve(__dirname, '../core/src')
      }
    }
}); 
>>>>>>> feat/53-build-runtime-fix
