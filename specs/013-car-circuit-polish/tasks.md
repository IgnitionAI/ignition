# Tasks: Car Circuit Demo Polish

**Feature**: `013-car-circuit-polish` | **Date**: 2026-04-11

## Phase 1: Chase Camera

- [x] T001 Replace OrbitControls with chase camera in `Scene3D.tsx` — useFrame lerp behind car

## Phase 2: Track Visuals

- [x] T002 Upgrade `Track3D.tsx` — grass ground, lane markings (dashed center), curbs on curves
- [x] T003 Add trail to `Car3D.tsx` — fading line from recent positions, clear on reset

## Phase 3: HUD + Minimap

- [x] T004 Create `Minimap.tsx` — 2D canvas overlay, track outline + car dot, top-right
- [x] T005 Create `HUD.tsx` — stats overlay (Episode, Laps, Steps, Mode), top-left, semi-transparent
- [x] T006 Update `store.ts` — add trail positions array

## Phase 4: Speed Slider

- [x] T007 Replace speed buttons with range slider in `Controls.tsx`

## Phase 5: Wire + Validate

- [x] T008 Update `App.tsx` — add Minimap + HUD as overlays on 3D scene
- [x] T009 Start server + visual verification
- [x] T010 Run full test suite

## Summary

| Total | 10 tasks |
