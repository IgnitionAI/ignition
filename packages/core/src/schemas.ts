import { z } from 'zod';

// ─── Experience ──────────────────────────────────────────────────────────────

export const ExperienceSchema = z.object({
  state: z.array(z.number(), { message: 'state must be an array of numbers' }),
  action: z.union([z.number(), z.array(z.number())], { message: 'action must be a number or number[]' }),
  reward: z.number({ message: 'reward must be a number' }),
  nextState: z.array(z.number(), { message: 'nextState must be an array of numbers' }),
  terminated: z.boolean({ message: 'terminated must be a boolean' }),
  truncated: z.boolean({ message: 'truncated must be a boolean' }),
  info: z.record(z.unknown()).optional(),
});
