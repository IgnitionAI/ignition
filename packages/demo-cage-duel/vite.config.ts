import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({ base: process.env.DEMO_BASE ?? './', server: { port: 3033, strictPort: true }, build: { target: 'es2022', rollupOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)), atelier: fileURLToPath(new URL('./atelier.html', import.meta.url)) } } } });
