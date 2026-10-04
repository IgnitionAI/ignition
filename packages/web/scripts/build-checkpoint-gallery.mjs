import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deepStrictEqual, strictEqual } from 'node:assert'
import { promoteDemos as promoteOutput } from './promote-demos.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const web = join(root, 'packages/web')
const catalogueBytes = readFileSync(join(web, 'data/checkpoints.json'))
const catalogue = JSON.parse(catalogueBytes)
const report = JSON.parse(readFileSync(join(root, 'docs/verification/continuous/point-mass-v1/report.json')))
strictEqual(catalogue.format, 'ignition-checkpoint-catalog-v1')
deepStrictEqual(catalogue.models.map(model => model.provenance.seed), report.manifest.protocol.trainingSeeds)
for (const entry of catalogue.models) {
  strictEqual(entry.artifact.source.type, 'local')
  const bytes = readFileSync(join(web, 'public', entry.artifact.source.path))
  strictEqual(bytes.byteLength, entry.artifact.bytes)
  strictEqual(createHash('sha256').update(bytes).digest('hex'), entry.artifact.sha256)
  const payload = JSON.parse(bytes)
  deepStrictEqual(payload.contract, entry.contract)
  strictEqual(payload.environment, entry.contract.environment.id)
  const seed = entry.provenance.seed
  const original = JSON.parse(readFileSync(join(root, `docs/verification/continuous/point-mass-v1/sac-${seed}.json`)))
  deepStrictEqual(payload.checkpoint, original)
  const result = report.results.find(result => result.seed === seed)
  strictEqual(entry.evaluation.protocol, report.manifest.protocol.id)
  strictEqual(entry.evaluation.episodes, result.trained.length)
  strictEqual(entry.evaluation.successes, result.successes)
  strictEqual(entry.evaluation.meanCost, result.trained.reduce((sum, episode) => sum + episode.cost, 0) / result.trained.length)
  strictEqual(entry.provenance.sourceCommit, report.manifest.sourceCommit)
  strictEqual(entry.provenance.samples, original.samples)
  strictEqual(entry.provenance.updates, original.updates)
}
mkdirSync(join(root, '.scratch'), { recursive: true })
const staging = mkdtempSync(join(root, '.scratch/models-lab-stage-'))
copyFileSync(join(root, 'packages/backend-tfjs/examples/continuous/index.html'), join(staging, 'index.html'))
execFileSync('pnpm', ['--filter', '@ignitionai/backend-onnx', 'exec', 'esbuild',
  resolve(root, 'packages/backend-tfjs/examples/continuous/app.ts'), '--bundle', '--platform=browser', '--format=esm',
  `--alias:@ignitionai/core=${resolve(root, 'packages/core/src/index.ts')}`, `--outfile=${join(staging, 'app.js')}`],
  { cwd: root, stdio: 'inherit' })
const models = join(web, 'public/models')
mkdirSync(models, { recursive: true })
writeFileSync(join(models, 'catalog.json'), catalogueBytes)
promoteOutput(staging, join(models, 'lab'), join(root, `.scratch/models-lab-backup-${Date.now()}`))
console.log(`Verified ${catalogue.models.length} report-backed checkpoints; built point-mass lab.`)
