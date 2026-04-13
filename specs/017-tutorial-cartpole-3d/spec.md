# Spec: Tutorial — CartPole 3D with React Three Fiber

**Branch**: `014-docs-complete` (bundled) | **Created**: 2026-04-13 | **Parent**: 014-docs-complete

## Summary

Add `/docs/tutorials/cartpole-3d.mdx`. Takes the Quickstart CartPole and wraps it in a React Three Fiber scene with a cart mesh and a pole mesh that read env state via refs. Teaches the reader the training-loop-vs-render-loop split in code.

## User Story (P2)

An R3F developer finishes the [R3F page](/docs/r3f) and wants a complete step-by-step example of wiring a TrainingEnv into an R3F project. This tutorial walks them from `npm create` to a visible 3D cart-pole learning in their browser.

**Independent test**: Reader starts from a fresh Vite + React + R3F project, follows the steps, and sees a 3D cart moving under DQN control within 30 minutes.

## Functional Requirements

- **FR-1**: Page exists at `packages/web/content/tutorials/cartpole-3d.mdx`.
- **FR-2**: `tutorials/_meta.js` includes `'cartpole-3d': 'CartPole 3D (R3F)'`.
- **FR-3**: Install command covers `@ignitionai/core`, `@ignitionai/backend-tfjs`, `react`, `react-dom`, `@react-three/fiber`, `three`. All real, published packages.
- **FR-4**: Walks through scaffolding a Vite React project, adding R3F, writing the CartPole env, mounting a 3D scene, wiring train loop + render loop.
- **FR-5**: Explicit "where the training loop is" callout showing how `useEffect` owns the trainer and `useFrame` owns the mesh updates.
- **FR-6**: Ends with the reader seeing a trained policy play live.

## Success Criteria

- Reader finishes in ~40 minutes (longer than 2D tutorials; R3F setup adds time).
- Reader can articulate why the training loop is NOT inside `useFrame`.
- Build passes.
