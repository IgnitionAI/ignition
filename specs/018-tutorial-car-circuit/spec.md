# Spec: Tutorial — Car Circuit

**Branch**: `014-docs-complete` (bundled) | **Created**: 2026-04-13 | **Parent**: 014-docs-complete

## Summary

Add `/docs/tutorials/car-circuit.mdx`. The "hero demo" reconstructed as a tutorial: a 3D car learns to drive an oval circuit. Teaches non-trivial reward shaping (track progress + lap bonus), chase camera, minimap, and the 1×–50× speed slider.

## User Story (P3)

A reader who finished CartPole 3D wants to tackle a more ambitious R3F project. This tutorial is the next level: physics-driven movement, non-trivial reward function, chase camera. It's the closest thing to a "build a game AI in an afternoon" experience IgnitionAI offers.

## Functional Requirements

- **FR-1**: Page exists at `packages/web/content/tutorials/car-circuit.mdx`.
- **FR-2**: `tutorials/_meta.js` includes `'car-circuit': 'Car Circuit'`.
- **FR-3**: Uses `@ignitionai/core`, `@ignitionai/backend-tfjs`, `@react-three/fiber`, `@react-three/drei`. No unpublished deps.
- **FR-4**: Covers: oval track definition, CarEnv with non-trivial physics, reward = track progress + lap bonus, Scene3D with car mesh + chase cam, minimap overlay.
- **FR-5**: Explicitly discusses the "lap bonus must fire only once per crossing" bug from the real demo — that's pedagogically valuable.

## Success Criteria

- Reader finishes in ~60 minutes.
- Reader understands the tradeoff between "dense progress rewards" and "episodic bonus rewards".
- Build passes.
