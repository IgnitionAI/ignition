import { z } from 'zod';

export const hfStorageConfigSchema = z.object({
  token: z
    .string()
    .min(1, 'HF_TOKEN is required')
    .startsWith('hf_', 'HF_TOKEN must start with "hf_"'),
  repoId: z
    .string()
    .min(1, 'HF_REPO_ID is required')
    .regex(/^[^/]+\/[^/]+$/, 'HF_REPO_ID must be in the format "owner/repo"'),
});

export type HFStorageConfig = z.infer<typeof hfStorageConfigSchema>;

/**
 * Read HF_TOKEN and HF_REPO_ID from environment variables and validate them.
 * Throws a descriptive ZodError if either is missing or malformed.
 */
export function parseHFConfig(env: Record<string, string | undefined> = process.env): HFStorageConfig {
  return hfStorageConfigSchema.parse({
    token: env['HF_TOKEN'],
    repoId: env['HF_REPO_ID'],
  });
}
