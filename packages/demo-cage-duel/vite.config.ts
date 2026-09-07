import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { createReadStream, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
    base: process.env.DEMO_BASE ?? './',
    server: { port: 3033, strictPort: true },
    plugins: [{
        name: 'private-blood-angel-preview',
        apply: 'serve',
        configureServer(server) {
            // Fixed local asset; no caller-supplied filesystem path or production copy.
            for (const filename of ['blood-angel-inspection.glb', 'blood-angel-combat.glb', 'blood-angel-mixamo.glb']) {
                server.middlewares.use('/models/purchased/' + filename, (req, res) => {
                    if (req.method !== 'GET' && req.method !== 'HEAD') {
                        res.statusCode = 405;
                        res.end();
                        return;
                    }
                    const path = join(homedir(), '.local/share/ignition-assets/blood-angel', filename);
                    try {
                        const stat = statSync(path);
                        res.setHeader('Content-Type', 'model/gltf-binary');
                        res.setHeader('Content-Length', stat.size);
                        res.setHeader('Cache-Control', 'no-store');
                        if (req.method === 'HEAD') { res.end(); return; }
                        const stream = createReadStream(path);
                        stream.on('error', () => res.destroy());
                        res.on('close', () => stream.destroy());
                        stream.pipe(res);
                    } catch {
                        res.statusCode = 404;
                        res.end('Private Blood Angel preview is not prepared on this computer.');
                    }
                });
            }
        }
    }],
    build: {
        target: 'es2022',
        rollupOptions: { input: {
            main: fileURLToPath(new URL('./index.html', import.meta.url)),
            credits: fileURLToPath(new URL('./credits.html', import.meta.url)),
            combat: fileURLToPath(new URL('./combat.html', import.meta.url)),
            animations: fileURLToPath(new URL('./animations.html', import.meta.url)),
            atelier: fileURLToPath(new URL('./atelier.html', import.meta.url))
        } }
    }
});
