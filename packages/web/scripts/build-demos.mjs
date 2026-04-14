#!/usr/bin/env node
/**
 * Build each Vite demo with a per-route `base` and copy the static
 * output into `packages/web/public/demos/<slug>/`. Runs as a prebuild
 * hook on `packages/web` so `pnpm --filter web build` produces a
 * self-contained Next.js deployment with all demos embedded.
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')
const webPublicDemos = join(repoRoot, 'packages/web/public/demos')

const DEMOS = [
  { slug: 'gridworld',   pkg: '@ignitionai/demo-gridworld',   dir: 'packages/demo-gridworld'   },
  { slug: 'cartpole',    pkg: '@ignitionai/demo-cartpole',    dir: 'packages/demo-cartpole'    },
  { slug: 'mountaincar', pkg: '@ignitionai/demo-mountaincar', dir: 'packages/demo-mountaincar' },
  { slug: 'cartpole-3d', pkg: '@ignitionai/demo-cartpole-3d', dir: 'packages/demo-cartpole-3d' },
  { slug: 'car-circuit', pkg: '@ignitionai/demo-car-circuit', dir: 'packages/demo-car-circuit' },
]

function run(cmd, env) {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: repoRoot, env: { ...process.env, ...env } })
}

// Clean destination
if (existsSync(webPublicDemos)) {
  rmSync(webPublicDemos, { recursive: true, force: true })
}
mkdirSync(webPublicDemos, { recursive: true })

for (const demo of DEMOS) {
  const demoDir = join(repoRoot, demo.dir)
  const distDir = join(demoDir, 'dist')
  const base = `/demos/${demo.slug}/`

  console.log(`\n=== Building ${demo.slug} (base=${base}) ===`)
  // Each demo exposes a "build" script via its own package.json that runs `vite build`.
  // We invoke pnpm per-package so the script finds the right working directory.
  run(`pnpm --filter "./${demo.dir}" build`, { DEMO_BASE: base })

  if (!existsSync(distDir)) {
    throw new Error(`[build-demos] expected ${distDir} to exist after build`)
  }

  const outDir = join(webPublicDemos, demo.slug)
  console.log(`Copying ${distDir} → ${outDir}`)
  cpSync(distDir, outDir, { recursive: true })
}

console.log('\n✓ All demos built and copied to packages/web/public/demos/')
