# Phase 1 Data Model: Documentation Tree

**Feature**: 014-docs-complete
**Date**: 2026-04-13

The "data model" of a docs feature is the content tree. This file is the single source of truth for `/speckit.tasks` — one task per row in the Page Catalog, and one task per `_meta.js` entry in the Sidebar Contracts section.

## Sidebar tree

```text
/docs
├── index.mdx                       Introduction
├── quickstart.mdx                  Quickstart
├── algorithms/
│   ├── index.mdx                   Algorithms · overview + chooser
│   ├── dqn.mdx                     DQN (verbose)
│   ├── ppo.mdx                     PPO (verbose)
│   └── q-table.mdx                 Q-Table (verbose)
├── how-it-works/
│   ├── index.mdx                   How it works · monorepo map
│   ├── core.mdx                    @ignitionai/core
│   ├── backend-tfjs.mdx            @ignitionai/backend-tfjs
│   ├── backend-onnx.mdx            @ignitionai/backend-onnx
│   └── storage.mdx                 @ignitionai/storage
├── r3f.mdx                         React Three Fiber · why and how
└── tutorials/
    ├── index.mdx                   Tutorials index
    └── grid-world.mdx              GridWorld (Start here)
```

## Page catalog

Each row is one authoring unit. The `FRs` column is the traceability matrix: every functional requirement from `spec.md` must be satisfied by at least one row.

| # | Route | File (under `packages/web/content/`) | Sidebar label | Word target | Prerequisites | FRs satisfied |
|---|---|---|---|---:|---|---|
| 1 | `/docs` | `index.mdx` | Introduction | 1200 | — | FR-007 |
| 2 | `/docs/quickstart` | `quickstart.mdx` | Quickstart | 1500 | Page 1 | FR-008, FR-009, FR-010 |
| 3 | `/docs/algorithms` | `algorithms/index.mdx` | Algorithms | 900 | Page 2 | FR-002 |
| 4 | `/docs/algorithms/dqn` | `algorithms/dqn.mdx` | DQN | 4000 | Page 3 | FR-011, FR-012, FR-027 |
| 5 | `/docs/algorithms/ppo` | `algorithms/ppo.mdx` | PPO | 4000 | Page 4 | FR-011, FR-013, FR-027 |
| 6 | `/docs/algorithms/q-table` | `algorithms/q-table.mdx` | Q-Table | 3500 | Page 5 | FR-011, FR-014, FR-027 |
| 7 | `/docs/how-it-works` | `how-it-works/index.mdx` | How it works | 800 | Page 2 | FR-003 |
| 8 | `/docs/how-it-works/core` | `how-it-works/core.mdx` | @ignitionai/core | 2500 | Page 7 | FR-015, FR-016 |
| 9 | `/docs/how-it-works/backend-tfjs` | `how-it-works/backend-tfjs.mdx` | @ignitionai/backend-tfjs | 2800 | Page 8 | FR-015, FR-017 |
| 10 | `/docs/how-it-works/backend-onnx` | `how-it-works/backend-onnx.mdx` | @ignitionai/backend-onnx | 2500 | Page 9 | FR-015, FR-018 |
| 11 | `/docs/how-it-works/storage` | `how-it-works/storage.mdx` | @ignitionai/storage | 1800 | Page 10 | FR-015, FR-019 |
| 12 | `/docs/r3f` | `r3f.mdx` | React Three Fiber | 1800 | Page 2 | FR-020, FR-021 |
| 13 | `/docs/tutorials` | `tutorials/index.mdx` | Tutorials | 700 | Page 2 | FR-004 |
| 14 | `/docs/tutorials/grid-world` | `tutorials/grid-world.mdx` | GridWorld | 2500 | Pages 2, 13 | FR-022, FR-023, FR-024 |

**Total**: 14 MDX files, ~30 500 words. `_meta.js` files counted separately as sidebar contracts.

## Page structural templates

Every page in a given group uses the same heading skeleton. This is what FR-025 (pedagogical consistency) enforces.

### Algorithm page skeleton

1. Front-matter (`title`, `description`)
2. One-paragraph intuition
3. "When to use [this algorithm]" callout
4. The core update rule in plain language + accessible math
5. What IgnitionAI actually does (replay buffer, target net, clip ratio, etc.)
6. **Default hyperparameters** table (exact values from `research.md` R1)
7. Tuning guide — which knobs to turn and in what order
8. 3–5 failure modes with symptoms + diagnostics + fixes
9. Next / Previous links

### Backend page skeleton

1. Front-matter
2. Single responsibility (one sentence)
3. Install command (with "publish pending" callout where applicable per R3)
4. Public API surface — table of exports with one-line descriptions (from `research.md` R2)
5. Annotated walkthrough of the most important file
6. GitHub source link
7. Next / Previous links

### Tutorial page skeleton

1. Front-matter (`title`, `description`, estimated time, difficulty level)
2. Prerequisites (Node version, package versions, starter template)
3. Step N — code + filename + observation + rationale (repeat)
4. Final state — what a successful run looks like
5. Next steps
6. Next / Previous links

## Content invariants (enforced at ship time)

- Every MDX file has front-matter with at least `title`.
- Every code block has a language tag.
- Every code block that depends on a file location has a `filename=` attribute.
- No `...` inside copy-paste-critical paths (imports, env-class body).
- Every algorithm page's "Default hyperparameters" table matches `research.md` R1.
- Every backend page's install command is valid on npm at ship time, OR the page carries the "publish pending" callout per `research.md` R3.
