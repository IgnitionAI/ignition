import type { CheckpointContract } from '../../../storage/src/catalog';

/** Versioned semantic identity for the point-mass catalogue consumer. */
export const POINT_MASS_CHECKPOINT_CONTRACT: CheckpointContract = {
  algorithm: 'sac', checkpointFormat: 'sac-v1',
  environment: { id: 'point-mass-v1', version: '1' },
  observation: { id: 'position-velocity', version: '1', shape: [2] },
  action: { kind: 'box', id: 'acceleration', version: '1', shape: [1], low: [-2], high: [2] },
};
