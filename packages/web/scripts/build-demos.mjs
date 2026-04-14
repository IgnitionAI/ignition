#!/usr/bin/env node
/**
 * Build each Vite demo with a per-route `base` and copy the static
 * output into `packages/web/public/demos/<slug>/`. Runs as a prebuild
 * hook on `packages/web` so `pnpm --filter web build` produces a
 * self-contained Next.js deployment with all demos embedded.
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')
const webPublicDemos = join(repoRoot, 'packages/web/public/demos')

console.log('[build-demos] script started')
console.log('[build-demos] repoRoot:', repoRoot)
console.log('[build-demos] webPublicDemos:', webPublicDemos)
console.log('[build-demos] cwd:', process.cwd())

const DEMOS = [
  { slug: 'gridworld',        pkg: 'demo-gridworld',        dir: 'packages/demo-gridworld'        },
  { slug: 'cartpole',         pkg: 'demo-cartpole',         dir: 'packages/demo-cartpole'         },
  { slug: 'mountaincar',      pkg: 'demo-mountaincar',      dir: 'packages/demo-mountaincar'      },
  { slug: 'cartpole-3d',      pkg: 'demo-cartpole-3d',      dir: 'packages/demo-cartpole-3d'      },
  { slug: 'car-circuit',      pkg: 'demo-car-circuit',      dir: 'packages/demo-car-circuit'      },
  { slug: 'drone-navigation', pkg: 'demo-drone-navigation', dir: 'packages/demo-drone-navigation' },
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

// ---------------------------------------------------------------------------
// 1. Build the library packages first.
//
// Each demo's build is `tsc -b && vite build`. TypeScript resolves
// `@ignitionai/core` via the package.json "types" field, which points at
// `dist/index.d.ts`. If we don't build the libraries first, tsc sees an
// empty module and every import fails. Vite's source aliases don't help
// because tsc runs before Vite. Ordering is enforced by pnpm's topological
// resolution across the --filter list.
// ---------------------------------------------------------------------------
console.log('\n=== Building library packages (topo order) ===')
run(
  'pnpm --filter @ignitionai/core ' +
  '--filter @ignitionai/backend-tfjs ' +
  '--filter @ignitionai/backend-onnx ' +
  '--filter @ignitionai/storage ' +
  '--filter @ignitionai/environments ' +
  'build',
)

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

// Write a manifest so we can verify from the deployed site which commit produced these demos
const manifest = {
  builtAt: new Date().toISOString(),
  commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local',
  demos: DEMOS.map((d) => d.slug),
}
writeFileSync(join(webPublicDemos, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log('\n✓ All demos built and copied to packages/web/public/demos/')
console.log('[build-demos] final listing:', readdirSync(webPublicDemos))
