# Implementation Plan: MountainCar Demo

**Branch**: `007-demo-mountaincar` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

MountainCar 2D demo — same validated pattern. Canvas with valley curve, car, flag. Sparse reward (-1/step). The showcase: agent discovers momentum strategy.

## Technical Context

Same stack as GridWorld/CartPole. Physics: standard OpenAI Gym MountainCar parameters.

## Project Structure

```text
packages/demo-mountaincar/
├── package.json, tsconfig.json, vite.config.ts
├── src/
│   ├── index.html, main.tsx, App.tsx, styles.css
│   ├── mountaincar-env.ts      # MountainCar physics
│   ├── MountainCarCanvas.tsx    # Canvas: valley + car + flag
│   ├── RewardChart.tsx, CodePanel.tsx, Controls.tsx, store.ts
└── test/
    └── mountaincar-env.test.ts
```

## MountainCar Physics

Position: [-1.2, 0.6], Velocity: [-0.07, 0.07]
Force: 0.001, Gravity: 0.0025
Height(x) = sin(3x) — the valley curve
Goal: position >= 0.5
