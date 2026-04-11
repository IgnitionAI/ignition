# Implementation Plan: Car on Circuit Demo

**Branch**: `012-demo-car-circuit` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

3D car on an oval circuit. Custom physics (not Rapier). R3F renders. Agent steers left/straight/right at constant speed. The key engineering challenge is the circuit geometry and track-relative observations.

## Circuit Geometry

An oval track defined as a **centerline path** — an array of 2D waypoints forming a closed loop:
- Two straight segments (top and bottom)
- Two semicircular curves (left and right)
- Track width: 2 units on each side of centerline (4 total)

The car's position is tracked as `(x, y)` in world space. To compute track-relative observations:
1. Find the nearest waypoint on the centerline
2. Compute signed distance from centerline (negative = left, positive = right)
3. Compute angle difference between car heading and track direction at that point

## Physics

Simple 2D car physics (top-down view, rendered in 3D):
- Position: `(x, y)` — world coordinates
- Heading: `angle` — radians, 0 = pointing right
- Speed: constant (0.1 units/step)
- Steering: action 0 → turn left (-0.05 rad), action 1 → straight, action 2 → turn right (+0.05 rad)
- Update: `x += speed * cos(angle)`, `y += speed * sin(angle)`, `angle += steerDelta`

## Observation Space (5 values, normalized)

1. `trackOffset` — signed distance from centerline / track half-width → [-1, 1]
2. `angleDiff` — angle between car heading and track direction → normalized
3. `distLeft` — distance to left edge / track width
4. `distRight` — distance to right edge / track width
5. `progress` — fraction of lap completed → [0, 1]

## Project Structure

```
packages/demo-car-circuit/
├── package.json, tsconfig.json, vite.config.ts
├── src/
│   ├── index.html, main.tsx, styles.css
│   ├── circuit-env.ts       # CircuitEnv implements TrainingEnv — physics + track geometry
│   ├── track.ts             # Oval track: waypoints, centerline, nearest point, distance
│   ├── App.tsx              # Wire env + 3D + UI
│   ├── Scene3D.tsx          # R3F Canvas, lighting, camera follow
│   ├── Car3D.tsx            # Car mesh (low-poly or box+wheels)
│   ├── Track3D.tsx          # Track surface, edges, start line
│   ├── RewardChart.tsx
│   ├── CodePanel.tsx
│   ├── Controls.tsx
│   └── store.ts
└── test/
    ├── track.test.ts        # Track geometry tests
    └── circuit-env.test.ts  # CircuitEnv physics + reward tests
```
