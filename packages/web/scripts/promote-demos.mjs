import { existsSync, renameSync } from 'node:fs'

/** Promote generated output while keeping the previous catalogue recoverable. */
export function promoteDemos(staging, target, backup, io = { existsSync, renameSync }) {
  const hadPrevious = io.existsSync(target)
  if (hadPrevious) io.renameSync(target, backup)
  try {
    io.renameSync(staging, target)
  } catch (error) {
    if (hadPrevious) {
      try { io.renameSync(backup, target) }
      catch (restoreError) { throw new AggregateError([error, restoreError], `Promotion failed; restore previous demos from ${backup}`) }
    }
    throw error
  }
}
