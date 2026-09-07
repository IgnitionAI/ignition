import { defineConfig } from 'vite';
export default defineConfig({ base: process.env.DEMO_BASE ?? './', server: { port: 3033, strictPort: true }, build: { target: 'es2022' } });
