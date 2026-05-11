#!/usr/bin/env node
/**
 * Bundle size analysis for @ignitionai/backend-onnx inference runtime.
 * Targets: < 50KB gzipped for the inference-only bundle.
 *
 * Usage:
 *   node scripts/bundle-analyze.mjs
 */

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { gzipSync } from 'zlib';

const OUTDIR = path.resolve(process.cwd(), '.bundle-analysis');
const ENTRY = path.resolve(process.cwd(), 'src/index.ts');

async function analyze() {
  console.log('🔬 Analyzing @ignitionai/backend-onnx bundle...\n');

  // Clean previous run
  if (fs.existsSync(OUTDIR)) {
    fs.rmSync(OUTDIR, { recursive: true });
  }

  // Bundle the full package
  const fullResult = await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'esm',
    target: 'es2022',
    external: ['onnxruntime-node', 'path', 'fs'], // Node-only modules
    metafile: true,
  });

  // Bundle inference-only subset (OnnxAgent + runtime, no exporter)
  const inferenceEntry = path.join(OUTDIR, 'inference-entry.ts');
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(
    inferenceEntry,
    `export { OnnxAgent } from '../src/agents/onnx-agent';
` +
    `export { createOnnxSession, runInference, inspectSession } from '../src/runtime-universal';`,
  );

  const inferenceResult = await esbuild.build({
    entryPoints: [inferenceEntry],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'esm',
    target: 'es2022',
    external: ['onnxruntime-node', 'onnxruntime-web', 'onnxruntime-common', 'zod', '@ignitionai/core'],
    metafile: true,
  });

  const sizeStr = (bytes) => {
    const kb = (bytes / 1024).toFixed(2);
    return `${kb} KB`;
  };

  const gzipSize = (code) => gzipSync(code).length;

  const fullCode = fullResult.outputFiles[0].text;
  const inferenceCode = inferenceResult.outputFiles[0].text;

  console.log('📦 Full package (browser):');
  console.log(`   Raw:    ${sizeStr(fullCode.length)}`);
  console.log(`   Gzip:   ${sizeStr(gzipSize(fullCode))}`);

  console.log('\n🎯 Inference-only subset (OnnxAgent + runtime):');
  console.log(`   Raw:    ${sizeStr(inferenceCode.length)}`);
  console.log(`   Gzip:   ${sizeStr(gzipSize(inferenceCode))}`);

  console.log('\n⚠️  Note: onnxruntime-web is an optional peer dependency.');
  console.log('   Its size (~800KB gzipped) is NOT included above.');
  console.log('   The numbers above reflect only IgnitionAI code.\n');

  if (gzipSize(inferenceCode) > 50 * 1024) {
    console.log('❌ FAIL: Inference-only bundle exceeds 50KB gzipped target');
    process.exit(1);
  } else {
    console.log('✅ PASS: Inference-only bundle is under 50KB gzipped target');
  }

  // Write detailed metafile for further inspection
  fs.writeFileSync(
    path.join(OUTDIR, 'meta.json'),
    JSON.stringify(inferenceResult.metafile, null, 2),
  );
  console.log(`\n📄 Detailed metafile written to: ${path.join(OUTDIR, 'meta.json')}`);
}

analyze().catch((err) => {
  console.error(err);
  process.exit(1);
});
