import * as dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

// Charger les variables d'environnement
dotenv.config();

// Déclarer les types d'environnement
declare global {
  interface ImportMetaEnv {
    VITE_HF_TOKEN: string;
  }
}

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
  },
  server: {
    port: 3000,
  },
  define: {
    'process.env': process.env
  },
  plugins: [react()],
    resolve: {
      alias: {
        '@ignitionai/backend-tfjs': path.resolve(__dirname, '../backend-tfjs/src'),
        '@ignitionai/core': path.resolve(__dirname, '../core/src')
      }
    }
}); 