import { z } from 'zod';

// ─── DQNConfig ────────────────────────────────────────────────────────────────

export const DQNConfigSchema = z
  .object({
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
  clipEpsilon: z
    .number()
    .min(0, { message: 'clipEpsilon must be >= 0' })
    .max(1, { message: 'clipEpsilon must be <= 1' }),
  gamma: z
    .number()
    .min(0, { message: 'gamma must be >= 0' })
    .max(1, { message: 'gamma must be <= 1' }),
  lambda: z
    .number()
    .min(0, { message: 'lambda must be >= 0' })
    .max(1, { message: 'lambda must be <= 1' }),
  epochs: z
    .number()
    .int()
    .positive({ message: 'epochs must be > 0' }),
  miniBatchSize: z
    .number()
    .int()
    .positive({ message: 'miniBatchSize must be > 0' }),
  entropyCoeff: z
    .number()
    .min(0, { message: 'entropyCoeff must be >= 0' }),
  valueLossCoeff: z
    .number()
    .positive({ message: 'valueLossCoeff must be > 0' }),
  learningRate: z
    .number()
    .positive({ message: 'learningRate must be > 0' })
    .lt(1, { message: 'learningRate must be < 1' }),
});

export type PPOConfig = z.infer<typeof PPOConfigSchema>;

// ─── QTableConfig ─────────────────────────────────────────────────────────────

export const QTableConfigSchema = z.object({
  stateSize: z
    .number()
    .int()
    .positive({ message: 'stateSize must be a positive integer' }),
  actionSize: z
    .number()
    .int()
    .positive({ message: 'actionSize must be a positive integer' }),
  learningRate: z
    .number()
    .positive({ message: 'learningRate must be > 0' })
    .lt(1, { message: 'learningRate must be < 1' }),
  gamma: z
    .number()
    .min(0, { message: 'gamma must be >= 0' })
    .max(1, { message: 'gamma must be <= 1' }),
  epsilon: z
    .number()
    .min(0, { message: 'epsilon must be >= 0' })
    .max(1, { message: 'epsilon must be <= 1' }),
  numBins: z
    .number()
    .int()
    .positive({ message: 'numBins must be > 0' }),
});

export type QTableConfig = z.infer<typeof QTableConfigSchema>;
