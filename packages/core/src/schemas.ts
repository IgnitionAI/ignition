import { z } from 'zod';

function functionField(label: string) {
  return z.custom<(...args: never[]) => unknown>(
    (val: unknown) => typeof val === 'function',
    { message: `${label} must be a function` },
  );
}

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

/** Same optional done/isDone pair as TrainingEnv; at least one function is required. */
export const TrainingEnvSchema = z.object({
  actions: z.union([
    z.array(z.string()).min(1, { message: 'TrainingEnv.actions must have at least one action' }),
    z.number().positive({ message: 'TrainingEnv.actions must have at least one action' }),
  ], { message: 'TrainingEnv.actions must be a string[] or a positive number' }),
  observe: functionField('observe'),
  step: functionField('step'),
  reward: functionField('reward'),
  reset: functionField('reset'),
  done: functionField('done').optional(),
  isDone: functionField('isDone').optional(),
  terminated: functionField('terminated').optional(),
  isTerminated: functionField('isTerminated').optional(),
  truncated: functionField('truncated').optional(),
  isTruncated: functionField('isTruncated').optional(),
}).refine(
  (env) => typeof env.done === 'function' || typeof env.isDone === 'function',
  { message: 'TrainingEnv must implement done() or isDone() as a function' },
);
