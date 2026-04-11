# Implementation Plan: CartPole 3D Hero Demo

**Branch**: `011-demo-cartpole-3d` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

3D CartPole demo using React Three Fiber for rendering, CartPoleEnv for physics. Same proven demo pattern (code panel, chart, controls, inference mode) but with polished 3D visuals.

## Key Architecture Decision

**CartPoleEnv does the physics. R3F only renders.**

The CartPoleEnv from `@ignitionai/environments` runs Euler integration. The 3D scene reads `env.state` (x, theta) and positions meshes accordingly. No Rapier physics — the RL agent needs deterministic physics, not a game engine.

## Project Structure

```
packages/demo-cartpole-3d/
├── package.json, tsconfig.json, vite.config.ts
├── src/
│   ├── index.html, main.tsx, styles.css
│   ├── App.tsx           # Layout: 3D scene top, code+chart+controls bottom
│   ├── Scene3D.tsx       # R3F Canvas with cart, pole, rail, lighting
│   ├── Cart.tsx          # Cart mesh (box, metallic material)
│   ├── Pole.tsx          # Pole mesh (cylinder, pivot rotation)
│   ├── Rail.tsx          # Rail mesh (thin box, ground plane)
│   ├── RewardChart.tsx   # Same Recharts pattern
│   ├── CodePanel.tsx     # 10-line code showcase
│   ├── Controls.tsx      # Train/Inference/Stop/Reset + algo dropdown
│   └── store.ts          # Zustand: CartPoleState + mode + rewardHistory
```

## Dependencies

- `@react-three/fiber` — R3F renderer
- `@react-three/drei` — OrbitControls, Environment, Stage
- `three` — 3D engine
- `recharts` — reward chart
- `zustand` — state management
- `@ignitionai/environments` — CartPoleEnv
- `@ignitionai/backend-tfjs` — IgnitionEnvTFJS
