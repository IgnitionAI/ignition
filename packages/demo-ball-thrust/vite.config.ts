import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ base: process.env.DEMO_BASE ?? '/', plugins: [react()] });
