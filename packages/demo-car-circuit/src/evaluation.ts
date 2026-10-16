import { IgnitionEnv, type AgentInterface } from '@ignitionai/core';
import { CircuitEnv, SIMULATION_STEP_SECONDS, type CircuitEpisode } from './circuit-env';

/** Fixed before checkpoint selection. Changing any setting requires a new id. */
export const CIRCUIT_PROTOCOL = Object.freeze({
  id: 'circuit-evaluation-v1',
  circuits: Object.freeze({
    training: Object.freeze({ straightLength: 10, radius: 4, halfWidth: 2 }),
    test: Object.freeze({ straightLength: 6, radius: 6, halfWidth: 2 }),
  }),
  startWaypoints: Object.freeze([0, 16, 32]),
  maxSteps: 1500,
  targetLaps: 3,
  stepSeconds: SIMULATION_STEP_SECONDS,
});

export interface CircuitEvaluationReport {
  schemaVersion: 1;
  protocolId: string;
  policyId: string;
  circuit: keyof typeof CIRCUIT_PROTOCOL.circuits;
  protocol: typeof CIRCUIT_PROTOCOL;
  episodes: (CircuitEpisode & { startWaypoint: number })[];
  totalTransitions: number;
  completedLaps: number;
  successfulEpisodes: number;
  offTrackEpisodes: number;
  truncatedEpisodes: number;
}

/** Uses only the policy's greedy action interface; never calls train/remember. */
export async function evaluateCircuit(
  policy: Pick<AgentInterface, 'getAction'>,
  options: { policyId: string; circuit: keyof typeof CIRCUIT_PROTOCOL.circuits },
): Promise<CircuitEvaluationReport> {
  if (!options.policyId.trim()) throw new Error('A versioned policyId is required');
  const track = CIRCUIT_PROTOCOL.circuits[options.circuit];
  if (!track) throw new Error('Unknown evaluation circuit');
  const episodes: CircuitEvaluationReport['episodes'] = [];
  for (const startWaypoint of CIRCUIT_PROTOCOL.startWaypoints) {
    const world = new CircuitEnv(track.straightLength, track.radius, track.halfWidth, {
      startWaypoint, maxSteps: CIRCUIT_PROTOCOL.maxSteps, targetLaps: CIRCUIT_PROTOCOL.targetLaps,
    });
    const loop = new IgnitionEnv(world);
    loop.agent = {
      async getAction(observation) {
        const action = await policy.getAction(observation, true);
        if (typeof action !== 'number' || !Number.isInteger(action) || action < 0 || action > 2) {
          throw new Error('Circuit policy must return a discrete action in [0, 2]');
        }
        return action;
      },
      remember() { throw new Error('Evaluation cannot record training experience'); },
      async train() { throw new Error('Evaluation cannot train'); },
    };
    for (let step = 0; step < CIRCUIT_PROTOCOL.maxSteps; step++) {
      const result = await loop.inferStep();
      if (result.terminated || result.truncated) break;
      // Resolved policy promises alone do not yield to rendering or input.
      if ((step + 1) % 32 === 0) await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    if (!world.lastEpisode) throw new Error('Evaluation did not produce a completed episode');
    episodes.push({ ...world.lastEpisode, startWaypoint });
  }
  return {
    schemaVersion: 1, protocolId: CIRCUIT_PROTOCOL.id, policyId: options.policyId,
    circuit: options.circuit, protocol: CIRCUIT_PROTOCOL, episodes,
    totalTransitions: episodes.reduce((sum, e) => sum + e.transitions, 0),
    completedLaps: episodes.reduce((sum, e) => sum + e.completedLaps, 0),
    successfulEpisodes: episodes.filter(e => e.endReason === 'success').length,
    offTrackEpisodes: episodes.filter(e => e.endReason === 'off-track').length,
    truncatedEpisodes: episodes.filter(e => e.endReason === 'time-limit').length,
  };
}
