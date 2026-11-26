/**
 * RL 2 benches, in display order. The control bench comes first. A bench whose
 * manifest is absent from the build is still listed and shows a "missing bench" error.
 * `dir` is the folder under public/ that holds manifest.json, experiment.json and
 * <algo>/seed-<n>/ for that bench.
 */
export interface Rl2Bench {
  id: string;
  dir: string;
}

export const RL2_BENCHES: readonly Rl2Bench[] = [
  { id: 'target-chasing', dir: 'dqn-vs-double' },
  { id: 'target-chasing-noisy', dir: 'dqn-vs-double-noisy' },
];

/** Bench whose page shows the easy-task reading when the logs support it. */
export const RL2_CONTROL_BENCH = 'target-chasing';

export const RL2_ALGOS = ['dqn', 'double-dqn'] as const;
export type Rl2Algo = (typeof RL2_ALGOS)[number];

/** Must match RL2_BIN_STEPS in scripts/rl2-curves.mjs (checked by a test). */
export const RL2_BIN_STEPS = 250;
