# Spec: Landing Changelog Integration

**Branch**: `main` (direct) | **Created**: 2026-04-15 | **Parent**: main

## Summary

Surface the IgnitionAI changelog on the landing and expose a full `/changelog` route. The single source of truth stays `CHANGELOG.md` at the repo root — both the landing section and the `/changelog` page are rendered from it at build time. No double-maintenance.

This also requires bringing `CHANGELOG.md` up to date with everything shipped since v0.1.0 (landing, Nextra docs, 6 demos, drone navigation, tutorials, favicon, etc.) as a `v0.2.0-dev` section.

## User Story (P2)

A visitor who already knows IgnitionAI returns to the landing periodically to see what's new. Today they have to scroll the GitHub commit log — there's no "what's new" view. The landing should have a visible "Recent updates" section listing the 3 most recent changelog entries, and a dedicated `/changelog` page for the full history.

**Independent test**: A visitor opens `ignitionai.dev`, scrolls to the "Recent updates" section, reads 3 bullet points about the latest release, and clicks "See full changelog →" which takes them to `/changelog` with the complete history rendered nicely.

**Acceptance scenarios**:
1. Landing has a section titled "Recent updates" showing the latest release's title + date + 3–5 bullet points.
2. The section has a "See full changelog →" link pointing to `/changelog`.
3. `/changelog` renders the entire `CHANGELOG.md` as a readable page, styled consistently with the landing (indigo palette, dark bg).
4. Footer has a "Changelog" link pointing to `/changelog`.
5. Updating `CHANGELOG.md` and rebuilding automatically updates both the landing section and the `/changelog` page.

## Functional Requirements

**Data source**
- **FR-1**: `CHANGELOG.md` at the repo root stays the single source of truth.
- **FR-2**: Markdown parsed at build time using a lightweight parser (no runtime markdown deps on the landing). A compact TypeScript helper splits it into `{ version, date, sections: [{ title, bullets[] }] }` entries.

**Landing section**
- **FR-3**: New `components/changelog.tsx` component that reads the parsed changelog via a Server Component + `fs.readFileSync` at build time.
- **FR-4**: Shows the **latest release only** with its version, date, and up to 5 highlighted bullets (cherry-picked from the most notable sections).
- **FR-5**: Section is placed after Demos and before CTA on the landing.
- **FR-6**: Includes a "See full changelog →" link to `/changelog`.

**Changelog page**
- **FR-7**: New `app/(default)/changelog/page.tsx` route that renders the full `CHANGELOG.md`.
- **FR-8**: Styled with tailwind prose / dark variant matching the docs aesthetic.
- **FR-9**: Page metadata has title "Changelog — IgnitionAI" and description.

**Footer**
- **FR-10**: `components/ui/footer.tsx` gets a "Changelog" link alongside Docs/GitHub/npm.

**Content update**
- **FR-11**: `CHANGELOG.md` gets a new `v0.2.0-dev` section at the top covering everything shipped since v0.1.0:
  - Landing page (Stellar-based, brand-adapted, flame logo, custom SVG diagrams)
  - Complete Nextra docs: intro, quickstart, 3 algorithm pages, 4 backend walkthroughs, R3F page, 7 tutorials
  - 6 live demos embedded under `/demos/*`
  - Drone Navigation demo with hand-rolled rigid-body physics
  - Car Circuit reward fix
  - Favicon + metadata cleanup
  - Vercel deploy on `ignitionai.dev`

## Success Criteria

- **SC-1**: Landing "Recent updates" section renders with real data from `CHANGELOG.md`, no hardcoded duplicates.
- **SC-2**: `/changelog` route renders the full history with legible styling.
- **SC-3**: A contributor can update `CHANGELOG.md` and see the landing reflect it after next build — no other files to touch.
- **SC-4**: Build passes (`pnpm --filter web build`).

## Assumptions

- Markdown parsing is simple because `CHANGELOG.md` follows a strict structure (`## vX.Y.Z — title (date)` headers, `### section` sub-headers, bullet lists). A 50-line parser is enough.
- No need for a third-party markdown library on the landing — keeps bundle small.
- The `/changelog` page can use `@next/mdx` (already installed) or a lightweight renderer. Pick whichever has zero bundle impact.
- Styling reuses the existing landing palette; no new tailwind classes.
