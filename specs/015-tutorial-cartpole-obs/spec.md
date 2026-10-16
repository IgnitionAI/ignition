# Spec: Tutorial — CartPole with a Custom Observation Space

**Branch**: `014-docs-complete` (bundled) | **Created**: 2026-04-13 | **Parent**: [014-docs-complete](../014-docs-complete/spec.md)

## Summary

Add `/docs/tutorials/cartpole-observations.mdx` — a tutorial that teaches readers how observations shape learning. Starting from the Quickstart CartPole, the reader builds three variants (partial, reordered, noisy) and observes how each affects training speed and final reward. Follows the Tutorial skeleton from `specs/014-docs-complete/data-model.md`.

## User Story (P2)

A reader who has finished the GridWorld tutorial wants to understand *why* `observe()` matters. They open this tutorial, follow four steps, and come away with a concrete intuition: **what the agent sees is what the agent can learn**.

**Independent test**: The reader takes the Quickstart CartPoleEnv, drops two of the four observations (e.g., remove cart position entirely), retrains, and observes that learning gets dramatically slower or breaks entirely. They then restore the observations and retrain successfully.

**Acceptance scenarios**:
1. The tutorial exists at `/docs/tutorials/cartpole-observations` with working Previous/Next links.
2. Every code block is copy-paste-runnable against `@ignitionai/core` + `@ignitionai/backend-tfjs`.
3. By the end, the reader has seen 3 obs variants and understands which one works best and why.

## Functional Requirements

- **FR-1**: Tutorial page exists as `packages/web/content/tutorials/cartpole-observations.mdx`.
- **FR-2**: `tutorials/_meta.js` includes a new entry `'cartpole-observations': 'CartPole: observations'`.
- **FR-3**: Tutorial uses the inlined CartPole from the Quickstart as its starting point — no unpublished package imports.
- **FR-4**: Page structure follows the Tutorial skeleton: front-matter, prerequisites, sequential steps with code + filename + observation + rationale, final state, next steps, Previous/Next links.
- **FR-5**: The tutorial demonstrates at least 3 observation variants (full, partial, noisy) and shows how each affects training.
- **FR-6**: Every code block specifies a filename.

## Success Criteria

- **SC-1**: Reader finishes in under 25 minutes with no prior IgnitionAI knowledge beyond the GridWorld tutorial.
- **SC-2**: Reader correctly answers "why did the partial-observation variant fail?" without re-reading the page.
- **SC-3**: Next build (`pnpm --filter web build`) passes with the new page.

## Assumptions

- GridWorld tutorial has already been completed — readers have the custom-env muscle.
- The Quickstart's inlined CartPole is the canonical starting point.
- We rely on reader intuition + clear writing, not live widgets.
