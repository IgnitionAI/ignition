# Spec: Tutorial — MountainCar with Reward Shaping

**Branch**: `014-docs-complete` (bundled) | **Created**: 2026-04-13 | **Parent**: 014-docs-complete

## Summary

Add `/docs/tutorials/mountaincar-shaping.mdx`. Teaches reward shaping by walking the reader through the classic sparse-reward MountainCar problem, showing why DQN fails on the sparse version, then fixing it with dense distance-based rewards.

## User Story (P2)

A reader who has completed the GridWorld tutorial (and ideally the CartPole observations tutorial) wants to understand why their custom env isn't learning. Sparse rewards are the #1 cause. This tutorial shows the failure mode and the fix, end-to-end.

**Independent test**: Reader implements MountainCar with the stock `reward = -1 per step` signal, observes that DQN never learns, then adds a shaping term based on distance to the goal flag and watches the agent converge.

## Functional Requirements

- **FR-1**: Page exists at `packages/web/content/tutorials/mountaincar-shaping.mdx`.
- **FR-2**: `tutorials/_meta.js` includes `'mountaincar-shaping': 'MountainCar: reward shaping'`.
- **FR-3**: Self-contained — reader copies the MountainCar env class from the tutorial, no unpublished package imports.
- **FR-4**: Two versions of the env class: sparse (broken) and shaped (working).
- **FR-5**: Explicit comparison section — what changes, why it helps, and why you should still prefer shaped rewards as a first instinct on any custom env.

## Success Criteria

- Reader finishes in ~30 minutes.
- Reader can articulate "sparse rewards don't tell the agent anything about *progress*" without re-reading.
- Build passes.
