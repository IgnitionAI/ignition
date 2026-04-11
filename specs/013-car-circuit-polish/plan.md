# Implementation Plan: Car Circuit Demo Polish

**Branch**: `013-car-circuit-polish` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

Visual and UX polish for the car circuit demo. No env logic changes. All modifications in `packages/demo-car-circuit/src/`.

## Files to modify/create

```
MODIFY: Scene3D.tsx    → chase camera (replace OrbitControls with useFrame lerp)
MODIFY: Track3D.tsx    → lane markings, curbs, grass
MODIFY: Car3D.tsx      → trail rendering
MODIFY: Controls.tsx   → range slider instead of buttons
MODIFY: store.ts       → trail positions array, best lap time
CREATE: Minimap.tsx    → 2D canvas overlay showing track + car dot
CREATE: HUD.tsx        → stats overlay (episode, laps, steps, mode)
MODIFY: App.tsx        → add Minimap + HUD overlays on top of 3D scene
```

## Chase Camera approach

Replace OrbitControls with a custom `useFrame` hook:
- Target position: behind car (offset in opposite direction of car heading)
- Camera lerps toward target each frame (smoothFactor = 0.05)
- LookAt: car position + slight forward offset
- No OrbitControls — camera is fully automated
