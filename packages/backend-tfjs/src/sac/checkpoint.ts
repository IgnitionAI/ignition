import { z } from 'zod';

const finite = z.number().finite();
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const settings = z.object({
  inputSize: integer, hiddenLayers: z.array(integer), lr: finite, gamma: finite, alpha: finite, tau: finite,
  batchSize: integer, memorySize: integer, warmup: integer, updateEvery: integer, seed: integer,
});
const weight = z.object({
  shape: z.array(z.number().int().positive()),
  values: z.array(finite.refine(value => Number.isFinite(Math.fround(value)), 'Weight overflows float32')),
});

export const sacCheckpointSchema = z.object({
  algorithm: z.literal('sac'), version: z.literal('sac-v1'), settings,
  low: z.array(finite), high: z.array(finite), samples: integer, updates: integer,
  randomState: integer.max(0xffffffff), networks: z.array(z.array(weight)).length(5),
});
