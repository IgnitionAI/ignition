import { z } from 'zod';
import type { StepResult } from './types';

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
<<<<<<< HEAD
=======

export type Experience = z.infer<typeof ExperienceSchema>;

// ─── AgentInterface ───────────────────────────────────────────────────────────
// Not a Zod schema (method signatures can't be validated at runtime),
// but kept here as the single source of truth alongside Experience.

export interface AgentInterface {
  getAction(observation: number[]): Promise<number>;
  remember(experience: Experience): void;
  train(): Promise<void>;
}

// ─── IgnitionEnvConfig ────────────────────────────────────────────────────────

export const IgnitionEnvConfigSchema = z.object({
  agent: z.custom<AgentInterface>(
    (val) => {
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
    (val) => typeof val === 'function',
    { message: 'getObservation must be a function returning number[]' }
  ),
  applyAction: z.custom<(action: number | number[]) => void>(
    (val) => typeof val === 'function',
    { message: 'applyAction must be a function' }
  ),
  computeReward: z.custom<() => number>(
    (val) => typeof val === 'function',
    { message: 'computeReward must be a function returning number' }
  ),
  isDone: z.custom<() => boolean>(
    (val) => typeof val === 'function',
    { message: 'isDone must be a function returning boolean' }
  ),
  onReset: z
    .custom<() => void>(
      (val) => typeof val === 'function',
      { message: 'onReset must be a function' }
    )
    .optional(),
  stepIntervalMs: z
    .number()
    .positive({ message: 'stepIntervalMs must be > 0' })
    .optional(),
  hfRepoId: z.string().optional(),
  hfToken: z.string().optional(),
  callbacks: z
    .custom<{
      onStep?: (result: StepResult, stepCount: number) => void | Promise<void>;
      onEpisodeEnd?: (stepCount: number) => void | Promise<void>;
    }>(
      (val) => val === undefined || typeof val === 'object',
      { message: 'callbacks must be an object with optional onStep/onEpisodeEnd' }
    )
    .optional(),
});

export type IgnitionEnvConfig = z.infer<typeof IgnitionEnvConfigSchema>;
>>>>>>> feat/53-build-runtime-fix
