# Implementation Plan: CartPole Demo

**Branch**: `006-demo-cartpole` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

CartPole 2D demo following the validated GridWorld pattern. Canvas rendering of cart+pole physics, code panel, reward chart, algorithm picker (DQN/PPO). New package `packages/demo-cartpole/`.

## Technical Context

Same stack as demo-gridworld: Vite + React + Recharts + Zustand + IgnitionEnvTFJS.
CartPole physics: Euler integration, standard OpenAI Gym parameters.

## Constitution Check

All gates PASS (same justification as demo-gridworld — TDD for physics, visual verification for UI).

## Project Structure

```text
packages/demo-cartpole/
├── package.json, tsconfig.json, vite.config.ts
├── src/
│   ├── index.html, main.tsx, App.tsx, styles.css
│   ├── cartpole-env.ts        # CartPole physics (pure TS)
│   ├── CartPoleCanvas.tsx      # Canvas rendering
│   ├── RewardChart.tsx         # Recharts (reuse pattern from gridworld)
│   ├── CodePanel.tsx           # Code showcase
│   ├── Controls.tsx            # Start/Stop/Reset + algo dropdown (DQN/PPO only)
│   └── store.ts                # Zustand store
└── test/
    └── cartpole-env.test.ts    # Physics tests
```

## CartPole Physics

Standard parameters: gravity=9.8, cartMass=1.0, poleMass=0.1, poleLength=0.5, forceMag=10.0, dt=0.02.

State: [x, xDot, theta, thetaDot]
Actions: 0=push left, 1=push right
Reward: +1 per step
Termination: |theta| > 12deg, |x| > 2.4, or steps >= 500
