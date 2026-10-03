import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateConversionScript } from '../exporter';

describe('generated ONNX conversion script', () => {
  it('delivers literal paths and formats to the converter without shell expansion', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ignition-export-'));
    const source = join(dir, "source ' quoted $(touch SHOULD_NOT_EXIST)");
    const intermediate = join(dir, "saved ' model");
    const output = join(dir, 'output " quoted.onnx');
    const trace = join(dir, 'trace.jsonl');
    const python = join(dir, 'python');
    writeFileSync(python, `#!${process.execPath}\nrequire('node:fs').appendFileSync(process.env.TRACE, JSON.stringify(process.argv.slice(2)) + '\\n');`, { mode: 0o755 });
    const script = join(dir, 'convert.sh');
    writeFileSync(script, generateConversionScript(source, intermediate, output, 15));
    execFileSync('bash', ['-n', script]);
    execFileSync('bash', [script], { cwd: dir, env: { ...process.env, PYTHON: python, TRACE: trace } });
    const calls = readFileSync(trace, 'utf8').trim().split('\n').map(line => JSON.parse(line) as string[]);
    expect(calls).toHaveLength(2);
    expect(calls[0].slice(2)).toEqual(['--input_format=tfjs_layers_model', '--output_format=keras_saved_model', join(source, 'model.json'), intermediate]);
    expect(calls[1]).toEqual(['-m', 'tf2onnx.convert', '--saved-model', intermediate, '--output', output, '--opset', '15']);
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid opset %s before generating a script', opset => {
    expect(() => generateConversionScript('/a', '/b', '/c', opset)).toThrow(/opset/);
  });
});
