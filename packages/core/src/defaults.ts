/**
 * Shallow-merge algorithm defaults with user overrides.
 * Overrides take precedence. Arrays are replaced, not deep-merged.
 */
export function mergeDefaults(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!overrides) return { ...defaults };
  return { ...defaults, ...overrides };
}
