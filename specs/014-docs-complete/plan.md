# Implementation Plan: Complete Documentation Site

**Branch**: `014-docs-complete` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-docs-complete/spec.md`

## Summary

Ship the complete `/docs` content for IgnitionAI on top of the Nextra scaffold already wired into `packages/web`. The feature produces exactly 14 MDX pages organized into six sidebar sections (Introduction, Quickstart, Algorithms, How it works, R3F, Tutorials) plus the required `_meta.js` files to drive navigation. No new infrastructure: Nextra, the catch-all route, the `content/` directory, and the dark-mode theme are all already in place from feature 013's follow-up work. The work is almost entirely authoring — with a hard requirement that every algorithm page's cited hyperparameter defaults match the source code at ship time, verified against `packages/backend-tfjs/src/`.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict) for any embedded components; MDX 3 for content
**Primary Dependencies**: `nextra@latest`, `nextra-theme-docs@latest` (already installed), `next@16.0.10`, `react@19.2.3` (already installed)
**Storage**: Flat MDX files under `packages/web/content/` + `_meta.js` sibling files for sidebar order. No database.
**Testing**: Manual acceptance scenarios from spec.md (authorial quality cannot be unit-tested); dev-server smoke test that every page renders without a Nextra build error; `pnpm --filter web build` must pass before merge.
**Target Platform**: Browsers — same deployment as landing page (single Vercel deploy, Next.js 16 SSG).
**Project Type**: Documentation site embedded in an existing Next.js web package (monorepo `packages/web`).
**Performance Goals**: First Contentful Paint for `/docs` under 1.5 s on broadband (Nextra default, no action needed). Sidebar search (Pagefind, bundled with Nextra) must index all pages.
**Constraints**: Single Vercel deployment (shared with landing). No new npm dependencies. Respect the constitution's monorepo boundaries — docs live under `packages/web`, never inside `packages/core|backend-tfjs|backend-onnx|storage`.
**Scale/Scope**: 14 MDX pages, ~4 000 words each for algorithm pages, ~2 500 words for backend pages, ~1 500 words for intro/quickstart/R3F, and a step-by-step tutorial of ~2 000 words. Total ~35 000 words.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Feature 014 is a documentation-only feature. The IgnitionAI constitution is primarily about framework code (TDD, modular packages, TF.js performance, strict TS). Only a subset of principles apply to authorship:

| Principle | Applicability | Compliance |
|---|---|---|
| **I. TDD (non-negotiable)** | N/A for prose. Where code snippets embedded in docs are executable, they must be validated by running them once against the latest published packages before merge. | ✅ Manual code-block runnability check required by SC-004. |
| **II. Modular monorepo architecture** | Docs live under `packages/web/content/`. They must not import from `packages/core`, `backend-tfjs`, etc. at build time — only show their code as static MDX snippets. | ✅ Content is inert MDX text; no cross-package imports. |
| **III. Robustness & defensive design** | Docs must degrade gracefully on mobile, slow networks, and deep-link entry points. | ✅ Covered by Nextra defaults + edge cases in spec.md. |
| **IV. Browser-first, performance-aware** | Pages must ship as SSG, no client-side RL training on doc pages. | ✅ Interactive widgets explicitly out of scope (spec Assumptions). |
| **V. Clean API & DX** | Every code snippet must use the real public API (`@ignitionai/core`, `@ignitionai/backend-tfjs`), not internals. | ✅ Enforced by FR-009, FR-026, FR-027. |
| **VI. Simplicity & YAGNI** | No custom MDX components beyond Nextra's built-in callouts/code blocks. | ✅ Zero new infrastructure. |

**Gate result**: PASS. No constitution violations. Complexity Tracking section left empty.

## Project Structure

### Documentation (this feature)

```text
specs/014-docs-complete/
├── plan.md              # This file
├── spec.md              # Feature specification (existing)
├── research.md          # Phase 0 — verified hyperparameter defaults + backend inventory
├── data-model.md        # Phase 1 — the sidebar tree and page metadata
├── contracts/
│   └── sidebar.md       # The _meta.js entries the site must expose
├── quickstart.md        # Phase 1 — how a contributor adds/edits a doc page
├── checklists/
│   └── requirements.md  # Existing quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

All authoring happens inside the existing `packages/web` Next.js app. No new packages, no new tests directory (docs are not unit-tested).

```text
packages/web/
├── content/                              # Nextra reads from here; contentDirBasePath='/docs'
│   ├── index.mdx                         # ← replaces the placeholder Introduction
│   ├── quickstart.mdx                    # ← rewrites the existing placeholder
│   ├── _meta.js                          # ← top-level sidebar order (updated)
│   ├── algorithms/
│   │   ├── _meta.js                      # NEW — sub-sidebar order: dqn, ppo, q-table
│   │   ├── index.mdx                     # NEW — algorithms overview + chooser
│   │   ├── dqn.mdx                       # NEW — verbose DQN page
│   │   ├── ppo.mdx                       # NEW — verbose PPO page
│   │   └── q-table.mdx                   # NEW — verbose Q-Table page
│   ├── how-it-works/
│   │   ├── _meta.js                      # NEW — order: core, backend-tfjs, backend-onnx, storage
│   │   ├── index.mdx                     # NEW — monorepo map
│   │   ├── core.mdx                      # NEW — TrainingEnv + auto-config internals
│   │   ├── backend-tfjs.mdx              # NEW — training loop, backend selection, setSpeed()
│   │   ├── backend-onnx.mdx              # NEW — export/convert/deploy pipeline
│   │   └── storage.mdx                   # NEW — HuggingFace save/load
│   ├── r3f.mdx                           # ← rewrites the existing placeholder
│   └── tutorials/
│       ├── _meta.js                      # NEW — tutorial order
│       ├── index.mdx                     # NEW — tutorials index, "Start here" marker
│       └── grid-world.mdx                # NEW — step-by-step GridWorld tutorial
├── app/docs/layout.tsx                   # Existing — no changes expected
├── app/docs/[[...mdxPath]]/page.jsx      # Existing — no changes expected
└── next.config.mjs                       # Existing — no changes expected
```

**Structure Decision**: Single existing Next.js app, Nextra-driven content tree under `packages/web/content/`. All new files are MDX + `_meta.js`. No changes to `next.config.mjs`, layouts, or the catch-all route.

## Phase 0 — Research

Before authoring a single word, resolve three questions whose answers shape the verbose algorithm pages and the backend pedagogy pages. Output to `research.md` with the Decision / Rationale / Alternatives format.

**R1 — What are the actual default hyperparameters in the shipped packages?**
Rationale: FR-011, FR-027, and SC-008 require every default cited in the docs to match the source code. Before writing the DQN/PPO/Q-Table pages, capture a snapshot of `packages/backend-tfjs/src/agents/{dqn,ppo,qtable}/*` defaults (learning rate, gamma, epsilon schedule, hidden layers, replay buffer size, batch size, update frequency, target-network sync interval, PPO clip ratio, GAE lambda). This becomes the single source of truth for the algorithm pages.

**R2 — What is the public API surface of each backend package at ship time?**
Rationale: FR-015 through FR-019 require accurate per-package pages. Enumerate the top-level exports of `@ignitionai/core`, `@ignitionai/backend-tfjs`, `@ignitionai/backend-onnx`, and `@ignitionai/storage` from each package's `index.ts`. For each symbol, note whether it is documented in the spec's FRs or new.

**R3 — Which backend packages are actually published to npm today?**
Rationale: The spec assumes `@ignitionai/core` and `@ignitionai/backend-tfjs` are live on npm. Before writing the How-it-works pages, confirm the actual published state of `backend-onnx` and `storage`. If a package is not yet published, the page must still exist (per FR-003) but must clearly label itself "ships with the monorepo; npm publish pending" instead of showing an install command that would fail.

**Output**: `research.md` with three sections (R1, R2, R3), each with verified findings copy-pasted from the source and/or npm registry responses. Research must be complete before any MDX page is written — the algorithm pages cannot be drafted without R1, and the backend pages cannot be drafted without R2 and R3.

## Phase 1 — Design & Contracts

**Prerequisites**: `research.md` complete.

1. **Data model — the sidebar tree** → `data-model.md`

   The only "data" in a docs feature is the page hierarchy. Produce a single tree diagram plus a table mapping each MDX file to: route, sidebar label, prerequisite pages, word-count target, and the FRs it satisfies. This table doubles as the traceability matrix that `/speckit.tasks` will consume — one task per row.

2. **Contracts — the `_meta.js` files** → `contracts/sidebar.md`

   The Nextra `_meta.js` files are the contract between the content tree and the navigation UI. Document each one exactly as it will be written to disk:
   - `content/_meta.js` — top-level order (index, quickstart, algorithms, how-it-works, r3f, tutorials)
   - `content/algorithms/_meta.js` — dqn, ppo, q-table with human-readable labels
   - `content/how-it-works/_meta.js` — core, backend-tfjs, backend-onnx, storage
   - `content/tutorials/_meta.js` — grid-world, marked as "Start here"

   These are contracts in the sense that `/speckit.tasks` will create tasks to write each file, and they must match this document exactly.

3. **Quickstart (for contributors, not readers)** → `quickstart.md`

   A two-page guide for a future contributor who wants to add or edit a doc page: where files live, how the sidebar updates, how to preview locally (`pnpm --filter web dev`), how code blocks are styled, and the style guide (short sentences, filename comments, no `...` placeholders). This is the first artifact a new contributor reads and it protects the site's consistency bar.

4. **Agent context update**

   Run `.specify/scripts/bash/update-agent-context.sh claude` so the AGENTS/CLAUDE file reflects the new docs feature.

**Output**: `research.md`, `data-model.md`, `contracts/sidebar.md`, `quickstart.md`, plus the refreshed agent context file.

## Post-design Constitution Re-check

After Phase 1, re-verify gates:

- **II. Modular monorepo architecture** — The MDX pages live only in `packages/web/content/`. No content file imports from another package. ✅
- **V. Clean API & DX** — The sidebar contract in `contracts/sidebar.md` shows every route visible to readers; no internal helper pages leak into the sidebar. ✅
- **VI. Simplicity & YAGNI** — No new npm dependencies, no custom MDX components, no new build steps. ✅

Gate result: PASS (unchanged).

## Complexity Tracking

No constitution violations — this section is intentionally empty.
