import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Tiny CHANGELOG.md parser.
 *
 * Expects the format:
 *
 *   # Changelog
 *
 *   ## vX.Y.Z — Title (YYYY-MM-DD)
 *
 *   ### Section name
 *   - bullet
 *   - bullet
 *
 *   ### Other section
 *   - bullet
 *
 *   ## vOlder — ...
 *
 * Returns one `Release` per `##` header. Each release has `sections`,
 * each section has `title` + `bullets[]`.
 */

export interface Section {
  title: string
  bullets: string[]
}

export interface Release {
  version: string       // "v0.2.0-dev"
  title: string         // "Landing, Docs, and Physics Demo"
  date: string          // "2026-04-15"
  sections: Section[]
}

const RELEASE_HEADER = /^##\s+(v[\w.-]+)\s+—\s+(.+?)\s+\((\d{4}-\d{2}-\d{2})\)\s*$/
const SECTION_HEADER = /^###\s+(.+?)\s*$/
const BULLET = /^-\s+(.+?)\s*$/

export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = []
  let current: Release | null = null
  let currentSection: Section | null = null

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.replace(/\r$/, '')

    const releaseMatch = line.match(RELEASE_HEADER)
    if (releaseMatch) {
      if (current) releases.push(current)
      current = {
        version: releaseMatch[1],
        title: releaseMatch[2],
        date: releaseMatch[3],
        sections: [],
      }
      currentSection = null
      continue
    }

    if (!current) continue

    const sectionMatch = line.match(SECTION_HEADER)
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1], bullets: [] }
      current.sections.push(currentSection)
      continue
    }

    const bulletMatch = line.match(BULLET)
    if (bulletMatch && currentSection) {
      currentSection.bullets.push(bulletMatch[1])
    }
  }

  if (current) releases.push(current)
  return releases
}

/**
 * Locate CHANGELOG.md at the repo root (we are at `packages/web/lib/`).
 */
function changelogPath(): string {
  return join(process.cwd(), '..', '..', 'CHANGELOG.md')
}

/**
 * Read + parse the repo CHANGELOG.md at build time.
 * Memoized per process.
 */
let cache: Release[] | null = null
export function getChangelog(): Release[] {
  if (cache) return cache
  const markdown = readFileSync(changelogPath(), 'utf8')
  cache = parseChangelog(markdown)
  return cache
}

/**
 * For the landing section: return the latest release, plus up to
 * `maxBullets` bullets flattened across all its sections.
 */
export function getLatestHighlights(maxBullets = 5): {
  release: Release | null
  highlights: { section: string; bullet: string }[]
} {
  const releases = getChangelog()
  const release = releases[0] ?? null
  if (!release) return { release, highlights: [] }

  const highlights: { section: string; bullet: string }[] = []
  for (const section of release.sections) {
    for (const bullet of section.bullets) {
      highlights.push({ section: section.title, bullet })
      if (highlights.length >= maxBullets) break
    }
    if (highlights.length >= maxBullets) break
  }
  return { release, highlights }
}
