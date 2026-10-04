import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const folder = 'packages/demo-car-circuit/src/public/reports/racing-q-v3';
const data = JSON.parse(await readFile(`${folder}/results.json`, 'utf8'));
const { manifest, additionalProvenance, reports } = data;
const protocol = manifest.protocol;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(protocol.id, 'racing-q-learning-v3');
assert.equal(protocol.seeds.length, 5);
assert.equal(new Set(protocol.seeds).size, 5);
assert.equal(protocol.evaluationSeeds.length, 5);
assert.equal(protocol.transitions, 20000);
assert.equal(reports.length, 10);

const sourceChecks = [];
for (const [path, expected] of Object.entries(manifest.sourceHashes)) {
  const archived = execFileSync('git', ['show', `${additionalProvenance.implementationCommit}:${path}`]);
  assert.equal(hash(archived), expected, `Archived source mismatch: ${path}`);
  sourceChecks.push({ path, archivedHash: expected, currentMatches: hash(await readFile(path)) === expected });
}
const reference = additionalProvenance.reference;
assert.equal(hash(execFileSync('git', ['show', `${manifest.head}:${reference.path}`])), reference.sha256);
const identities = new Set();
const rows = [];
for (const report of reports) {
  const identity = `${report.algorithm}-${report.seed}`;
  assert.ok(['dqn', 'double-dqn'].includes(report.algorithm));
  assert.ok(protocol.seeds.includes(report.seed));
  assert.ok(!identities.has(identity), `Duplicate policy: ${identity}`);
  identities.add(identity);
  assert.equal(report.transitions, protocol.transitions);
  assert.ok(Number.isInteger(report.updates) && report.updates > 0);
  assert.equal(report.backend, manifest.backend);
  assert.ok(Number.isFinite(report.trainingSeconds) && report.trainingSeconds > 0);
  assert.ok(Number.isFinite(report.evaluationSeconds) && report.evaluationSeconds > 0);
  assert.equal(report.reports.length, 20);
  const checkpoint = JSON.parse(await readFile(`${folder}/${identity}.json`, 'utf8'));
  assert.equal(checkpoint.algorithm, report.algorithm);
  assert.equal(checkpoint.protocol, protocol.id);
  assert.equal(checkpoint.driving, 'circuit-racing-v2');
  assert.equal(checkpoint.observation, 'racing-observation-v1');
  assert.equal(checkpoint.seed, report.seed);
  assert.equal(checkpoint.samples, report.transitions);
  assert.equal(checkpoint.updates, report.updates);
  assert.deepEqual(checkpoint.configuration, protocol);
  assert.ok(Date.parse(checkpoint.createdAt) > Date.parse(manifest.createdAt));
  assert.deepEqual(checkpoint.weights.map(weight => weight.shape), [[20, 32], [32], [32, 32], [32], [32, 9], [9]]);
  for (const weight of checkpoint.weights) {
    assert.equal(weight.values.length, weight.shape.reduce((product, size) => product * size, 1));
    assert.ok(weight.values.every(Number.isFinite));
  }
  const scenarios = new Set();
  for (const episode of report.reports) {
    assert.ok(protocol.evaluationSeeds.includes(episode.seed));
    assert.equal(typeof episode.test, 'boolean');
    assert.equal(typeof episode.traffic, 'boolean');
    const key = `${episode.seed}-${episode.test}-${episode.traffic}`;
    assert.ok(!scenarios.has(key), `Duplicate scenario: ${identity}/${key}`);
    scenarios.add(key);
    assert.ok(Number.isInteger(episode.laps) && episode.laps >= 0 && episode.laps <= 3);
    assert.equal(episode.completed, episode.finishSeconds !== null);
    assert.equal(episode.success, episode.completed && episode.rescues === 0 && episode.penaltySeconds <= 10);
    assert.ok(Number.isFinite(episode.penaltySeconds) && episode.penaltySeconds >= 0);
    assert.ok(Number.isInteger(episode.rescues) && episode.rescues >= 0);
    assert.ok(Number.isInteger(episode.contacts) && episode.contacts >= 0);
    if (episode.completed) {
      assert.equal(episode.laps, 3);
      assert.ok(Number.isFinite(episode.finishSeconds) && episode.finishSeconds > 0);
    }
  }
  rows.push({ identity, successes: report.reports.filter(episode => episode.success).length,
    completed: report.reports.filter(episode => episode.completed).length,
    trainingSeconds: report.trainingSeconds, evaluationSeconds: report.evaluationSeconds });
}
const stats = ['dqn', 'double-dqn'].map(algorithm => {
  const selected = rows.filter(row => row.identity.startsWith(`${algorithm}-`));
  assert.equal(selected.length, 5);
  const rates = selected.map(row => row.successes / 20 * 100);
  const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  return { algorithm, successes: selected.reduce((sum, row) => sum + row.successes, 0),
    completed: selected.reduce((sum, row) => sum + row.completed, 0), mean,
    populationStd: Math.sqrt(rates.reduce((sum, rate) => sum + (rate - mean) ** 2, 0) / rates.length),
    min: Math.min(...rates), max: Math.max(...rates) };
});
const audit = { protocol: protocol.id, measuredCommit: additionalProvenance.implementationCommit,
  backend: manifest.backend, policies: rows.length, episodes: reports.reduce((sum, report) => sum + report.reports.length, 0),
  sourceChecks, stats, rows, passed: true };
const output = process.argv[2] ?? '.scratch/racing-q-audit.json';
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify({ policies: audit.policies, episodes: audit.episodes, stats, passed: audit.passed }));
