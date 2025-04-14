import { defineConfig } from 'vite';
import * as dotenv from 'dotenv';

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
  }
}); 