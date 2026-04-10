import { z } from 'zod';
import type { AgentInterface, StepResult } from './types';

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

// ─── Callbacks ───────────────────────────────────────────────────────────────

export interface IgnitionEnvCallbacks {
  onStep?: (result: StepResult, stepCount: number) => void | Promise<void>;
  onEpisodeEnd?: (stepCount: number) => void | Promise<void>;
}

// ─── IgnitionEnvConfig ────────────────────────────────────────────────────────

export const IgnitionEnvConfigSchema = z.object({
  agent: z.custom<AgentInterface>(
    (val: unknown) => {
      if (val === null || typeof val !== 'object') return false;
      const a = val as AgentInterface;
      return (
        typeof a.getAction === 'function' &&
        typeof a.remember === 'function' &&
        typeof a.train === 'function'
      );
    },
    { message: 'agent must implement AgentInterface (getAction, remember, train)' }
  ),
  getObservation: z.custom<() => number[]>(
    (val: unknown) => typeof val === 'function',
    { message: 'getObservation must be a function returning number[]' }
  ),
  applyAction: z.custom<(action: number | number[]) => void>(
    (val: unknown) => typeof val === 'function',
    { message: 'applyAction must be a function' }
  ),
  computeReward: z.custom<() => number>(
    (val: unknown) => typeof val === 'function',
    { message: 'computeReward must be a function returning number' }
  ),
  isTerminated: z.custom<() => boolean>(
    (val: unknown) => typeof val === 'function',
    { message: 'isTerminated must be a function returning boolean' }
  ),
  isTruncated: z.custom<() => boolean>(
    (val: unknown) => typeof val === 'function',
    { message: 'isTruncated must be a function returning boolean' }
  ).optional(),
  callbacks: z.custom<IgnitionEnvCallbacks>(
    (val: unknown) => val === undefined || (typeof val === 'object' && val !== null),
    { message: 'callbacks must be an object with onStep/onEpisodeEnd functions' }
  ).optional(),
  onReset: z
    .custom<() => void>(
      (val: unknown) => typeof val === 'function',
      { message: 'onReset must be a function' }
    )
    .optional(),
  stepIntervalMs: z
    .number()
    .positive({ message: 'stepIntervalMs must be > 0' })
    .optional(),
  hfRepoId: z.string().optional(),
  hfToken: z.string().optional(),
});

export type IgnitionEnvConfig = z.infer<typeof IgnitionEnvConfigSchema>;
