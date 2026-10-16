import { expect, it, vi } from 'vitest';
import { evaluateCircuit, CIRCUIT_PROTOCOL } from '../src/evaluation';

it('evaluates a fixed policy reproducibly without training or recording experience', async () => {
  const policy = { getAction: vi.fn(async (_observation: number[], _greedy?: boolean) => 0), train: vi.fn(), remember: vi.fn() };
  const options = { policyId: 'left-only-v1', circuit: 'test' as const };
  const first = await evaluateCircuit(policy, options);
  const second = await evaluateCircuit(policy, options);
  expect(second).toEqual(first);
  expect(first.schemaVersion).toBe(1);
  expect(first.protocolId).toBe(CIRCUIT_PROTOCOL.id);
  expect(first.episodes).toHaveLength(3);
  expect(first.episodes.every(e => e.endReason === 'off-track')).toBe(true);
  expect(first.totalTransitions).toBeGreaterThan(0);
  expect(first.offTrackEpisodes).toBe(3);
  expect(first.completedLaps).toBe(0);
  expect(policy.train).not.toHaveBeenCalled();
  expect(policy.remember).not.toHaveBeenCalled();
  expect(policy.getAction.mock.calls.every(call => call[1] === true)).toBe(true);
  expect(JSON.parse(JSON.stringify(first))).toEqual(first);
});

it('declares different training and held-out circuits before evaluation', () => {
  expect(CIRCUIT_PROTOCOL.circuits.training).not.toEqual(CIRCUIT_PROTOCOL.circuits.test);
});

it('reports complete laps and simulated lap times for a lane-following reference controller', async () => {
  const report = await evaluateCircuit({ async getAction(observation) {
    return observation[1] > 0.008 ? 2 : observation[1] < -0.008 ? 0 : 1;
  } }, { policyId: 'reference-controller-v1', circuit: 'training' });
  expect(report.successfulEpisodes).toBe(3);
  expect(report.completedLaps).toBe(9);
  for (const episode of report.episodes) {
    expect(episode.lapTimesSeconds).toHaveLength(3);
    expect(episode.simulationSeconds).toBeCloseTo(episode.lapTimesSeconds.reduce((a, b) => a + b, 0));
  }
});

it('rejects invalid policy actions instead of silently treating them as straight', async () => {
  await expect(evaluateCircuit({ getAction: async () => 42 }, {
    policyId: 'invalid', circuit: 'test',
  })).rejects.toThrow('discrete action');
});

it('yields to browser tasks while evaluating without changing the report', async () => {
  let browserTaskRan = false;
  const task = new Promise<void>(resolve => setTimeout(() => { browserTaskRan = true; resolve(); }, 0));
  await evaluateCircuit({ async getAction(observation) {
    return observation[1] > 0.008 ? 2 : observation[1] < -0.008 ? 0 : 1;
  } }, { policyId: 'reference-controller-v1', circuit: 'training' });
  expect(browserTaskRan).toBe(true);
  await task;
});
