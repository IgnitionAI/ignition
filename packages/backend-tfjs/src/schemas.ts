import { z } from 'zod';

const TFBackendSchema = z.enum(['webgpu', 'webgl', 'cpu', 'wasm', 'node', 'auto']).optional();

// ─── DQNConfig ────────────────────────────────────────────────────────────────

export const DQNConfigSchema = z
  .object({
    doubleQ: z.boolean().optional(),
    seed: z.number().int().min(1).max(1000000).optional(),
    backend: TFBackendSchema,
    inputSize: z
      .number()
      .int()
      .positive({ message: 'inputSize must be a positive integer' }),
    actionSize: z
      .number()
      .int()
      .positive({ message: 'actionSize must be a positive integer' }),
    hiddenLayers: z
      .array(z.number().int().positive({ message: 'each hiddenLayer value must be a positive integer' }))
      .optional(),
    gamma: z
      .number()
      .min(0, { message: 'gamma must be >= 0' })
      .max(1, { message: 'gamma must be <= 1' })
      .optional(),
    epsilon: z
      .number()
      .min(0, { message: 'epsilon must be >= 0' })
      .max(1, { message: 'epsilon must be <= 1' })
      .optional(),
    epsilonDecay: z
      .number()
      .positive({ message: 'epsilonDecay must be > 0' })
      .optional(),
    minEpsilon: z
      .number()
      .min(0, { message: 'minEpsilon must be >= 0' })
      .max(1, { message: 'minEpsilon must be <= 1' })
      .optional(),
    lr: z
      .number()
      .positive({ message: 'lr must be > 0' })
      .lt(1, { message: 'lr must be < 1' })
      .optional(),
    batchSize: z
      .number()
      .int()
      .positive({ message: 'batchSize must be > 0' })
      .optional(),
    memorySize: z
      .number()
      .int()
      .positive({ message: 'memorySize must be > 0' })
      .optional(),
    targetUpdateFrequency: z
      .number()
      .int()
      .positive({ message: 'targetUpdateFrequency must be > 0' })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.memorySize !== undefined && data.batchSize !== undefined) {
        return data.memorySize > data.batchSize;
      }
      return true;
    },
    { message: 'memorySize must be > batchSize' }
  );

export type DQNConfig = z.infer<typeof DQNConfigSchema>;

// ─── PPOConfig ────────────────────────────────────────────────────────────────

export const PPOConfigSchema = z.object({
  rolloutSize: z.number().int().positive().optional(),
  backend: TFBackendSchema,
  inputSize: z
    .number()
    .int()
    .positive({ message: 'inputSize must be a positive integer' }),
  actionSize: z
    .number()
    .int()
    .positive({ message: 'actionSize must be a positive integer' }),
  hiddenLayers: z
    .array(z.number().int().positive({ message: 'each hiddenLayer value must be a positive integer' }))
    .optional(),
  lr: z
    .number()
    .positive({ message: 'lr must be > 0' })
    .lt(1, { message: 'lr must be < 1' })
    .optional(),
  gamma: z
    .number()
    .min(0, { message: 'gamma must be >= 0' })
    .max(1, { message: 'gamma must be <= 1' })
    .optional(),
  gaeLambda: z
    .number()
    .min(0, { message: 'gaeLambda must be >= 0' })
    .max(1, { message: 'gaeLambda must be <= 1' })
    .optional(),
  clipRatio: z
    .number()
    .min(0, { message: 'clipRatio must be >= 0' })
    .max(1, { message: 'clipRatio must be <= 1' })
    .optional(),
  epochs: z
    .number()
    .int()
    .positive({ message: 'epochs must be > 0' })
    .optional(),
  batchSize: z
    .number()
    .int()
    .positive({ message: 'batchSize must be > 0' })
    .optional(),
  entropyCoef: z
    .number()
    .min(0, { message: 'entropyCoef must be >= 0' })
    .optional(),
  valueLossCoef: z
    .number()
    .positive({ message: 'valueLossCoef must be > 0' })
    .optional(),
  storageProvider: z.any().optional(), // ModelStorageProvider instance
});

export type PPOConfig = z.infer<typeof PPOConfigSchema>;

// ─── QTableConfig ─────────────────────────────────────────────────────────────

export const QTableConfigSchema = z.object({
  backend: TFBackendSchema,
  inputSize: z
    .number()
    .int()
    .positive({ message: 'inputSize must be a positive integer' }),
  actionSize: z
    .number()
    .int()
    .positive({ message: 'actionSize must be a positive integer' }),
  stateBins: z
    .number()
    .int()
    .positive({ message: 'stateBins must be > 0' })
    .optional(),
  stateLow: z
    .array(z.number().finite())
    .optional(),
  stateHigh: z
    .array(z.number().finite())
    .optional(),
  lr: z
    .number()
    .positive({ message: 'lr must be > 0' })
    .lt(1, { message: 'lr must be < 1' })
    .optional(),
  gamma: z
    .number()
    .min(0, { message: 'gamma must be >= 0' })
    .max(1, { message: 'gamma must be <= 1' })
    .optional(),
  epsilon: z
    .number()
    .min(0, { message: 'epsilon must be >= 0' })
    .max(1, { message: 'epsilon must be <= 1' })
    .optional(),
  epsilonDecay: z
    .number()
    .positive({ message: 'epsilonDecay must be > 0' })
    .optional(),
  minEpsilon: z
    .number()
    .min(0, { message: 'minEpsilon must be >= 0' })
    .max(1, { message: 'minEpsilon must be <= 1' })
    .optional(),
  storageProvider: z.any().optional(), // ModelStorageProvider instance
}).superRefine((config, context) => {
  const low = config.stateLow ?? new Array<number>(config.inputSize).fill(0);
  const high = config.stateHigh ?? new Array<number>(config.inputSize).fill(1);
  if (low.length !== config.inputSize || high.length !== config.inputSize) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'stateLow and stateHigh must have inputSize elements' });
  } else if (low.some((value, index) => high[index] <= value)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Each stateHigh must be greater than stateLow' });
  }
  if ((config.stateBins ?? 10) ** config.inputSize > Number.MAX_SAFE_INTEGER) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Q-table state encoding exceeds Number.MAX_SAFE_INTEGER; reduce inputSize or stateBins' });
  }
});

export type QTableConfig = z.infer<typeof QTableConfigSchema>;
