import type { Action, Telemetry } from './simulation-contract';
export type PDState = { residual: [number, number, number] };
export const PD_GAINS = Object.freeze({ position: 0.16, velocity: 0.8, yaw: 0.8, angularVelocity: 1.8 });
export function createPDState(): PDState { return { residual: [0, 0, 0] }; }
const bounded = (value: number) => Math.max(-2, Math.min(2, value));
// Pure sensing + discrete allocation. No environment/body access, no learned weights.
export function scriptedPD(t: Telemetry, state: PDState): Action {
  const c = t.cargo, d = t.drone, g = PD_GAINS;
  const vx = (300 * c.velocity.x + 120 * d.velocity.x) / 420;
  const vz = (300 * c.velocity.z + 120 * d.velocity.z) / 420;
  const fx = 420 * (g.position * (6 - c.position.x) - g.velocity * vx);
  const fz = 420 * (g.position * -c.position.z - g.velocity * vz);
  const cosine = Math.cos(d.yaw), sine = Math.sin(d.yaw);
  const demand = [(cosine * fx - sine * fz) / 600, (sine * fx + cosine * fz) / 120,
    657.43 * (g.yaw * t.yawError - g.angularVelocity * c.angularVelocity.y) / 300];
  const target = state.residual.map((value, index) => bounded(value + demand[index]));
  // Lateral force at drone COM: torqueY=-rX*Fz (rX=1.642857m).
  const candidates = [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, -1, 0.657143],
    [0, 1, -0.657143], [0, 0, 1], [0, 0, -1]];
  let best = 0, error = Infinity;
  candidates.forEach((candidate, index) => {
    const score = candidate.reduce((sum, value, axis) => sum + (target[axis] - value) ** 2, 0);
    if (score < error) { error = score; best = index; }
  });
  state.residual = target.map((value, index) => bounded(value - candidates[best][index])) as PDState['residual'];
  return best as Action;
}
