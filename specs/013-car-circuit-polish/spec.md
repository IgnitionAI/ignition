# Feature Specification: Car Circuit Demo Polish

**Feature Branch**: `013-car-circuit-polish`  
**Created**: 2026-04-11  
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chase Camera (Priority: P1)

A visitor opens the demo. Instead of a distant top-down view, the camera is behind and above the car — like a racing game. As the car turns through curves, the camera smoothly follows with a slight delay, creating a cinematic feel. During training the camera follows the car's frantic zigzagging. During inference the camera glides smoothly behind the car as it drives perfectly.

**Why this priority**: The camera makes or breaks immersion. A static top-down view feels like a debug tool. A chase cam feels like a game.

**Acceptance Scenarios**:

1. **Given** training starts, **Then** the camera positions itself behind and above the car, following its movement with smooth interpolation
2. **Given** the car turns through a curve, **Then** the camera rotates to follow, with a slight lag that creates natural motion
3. **Given** the car resets to start, **Then** the camera smoothly transitions to the new position (no teleport)

---

### User Story 2 - Track Visual Upgrade (Priority: P2)

The track looks like a real circuit: dark asphalt surface, white lane markings (dashed center line, solid edges), red/white curbs on the inside of curves, green grass outside the track. The car is clearly visible against the track — a bright colored body with visible wheels.

**Why this priority**: Visual contrast and detail make the demo look professional. A gray track on a gray ground looks unfinished.

**Acceptance Scenarios**:

1. **Given** the scene loads, **Then** the track surface is visually distinct from the surrounding ground (asphalt vs grass)
2. **Given** the track, **Then** dashed white lane markings are visible along the centerline
3. **Given** the track edges, **Then** curbs (alternating red/white) are visible on curve interiors
4. **Given** the car, **Then** it is clearly visible against the track at all camera angles

---

### User Story 3 - HUD Overlay (Priority: P3)

Overlaid on the 3D scene (not below it), the user sees: a minimap in the top-right corner showing the full track with a dot for the car, and stats in the top-left showing episode number, laps, steps, and current mode. This keeps the 3D scene as the full hero area.

**Why this priority**: Information overlaid on the scene is the standard for games and simulations. Putting stats below the scene wastes vertical space and breaks immersion.

**Acceptance Scenarios**:

1. **Given** the scene, **Then** a minimap in the top-right corner shows the track outline and car position as a colored dot
2. **Given** the scene, **Then** stats overlay in the top-left shows: Episode, Laps, Steps, Mode
3. **Given** training mode, **Then** the minimap dot is green. In inference, it's blue.

---

### User Story 4 - Speed Slider (Priority: P3)

A proper range slider for training speed, not tiny buttons. Draggable, with a label showing the current multiplier (1x to 50x). Positioned prominently below the scene.

**Acceptance Scenarios**:

1. **Given** the controls area, **Then** a horizontal slider goes from 1x to 50x speed
2. **Given** the slider is dragged to 50x, **Then** training runs ~50 times faster
3. **Given** the slider, **Then** the current speed multiplier is shown as a label (e.g. "25x")

---

### User Story 5 - Car Trail (Priority: P3)

The car leaves a fading trail on the track showing its recent path — a thin line that fades from bright to transparent over the last 50 steps. During training, the trail shows the chaotic zigzag. During inference, the trail shows a smooth line following the center.

**Acceptance Scenarios**:

1. **Given** the car is moving, **Then** a colored trail renders behind it on the track surface
2. **Given** the trail, **Then** it fades from bright (recent) to transparent (old) over ~50 positions
3. **Given** episode reset, **Then** the trail clears

---

### Edge Cases

- What if the car moves too fast for the camera? Camera uses lerp/damping — it catches up smoothly, never teleports.
- What if the minimap is too small on mobile? Minimap size is fixed at 150x150px — readable on desktop, acceptable on mobile.
- What if 50x speed causes frame drops? The 3D render runs at display FPS independently. At high speed, the visual just updates less frequently — the car "jumps" between positions. Training is not affected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The camera MUST follow the car from behind and above (third-person chase cam) with smooth interpolation
- **FR-002**: The track MUST have visual distinction: asphalt surface, white lane markings, curbs, grass surround
- **FR-003**: A minimap MUST show the full track outline and car position, overlaid on the 3D scene (top-right)
- **FR-004**: Stats (Episode, Laps, Steps, Mode) MUST be overlaid on the 3D scene (top-left)
- **FR-005**: A range slider MUST control training speed from 1x to 50x
- **FR-006**: The car MUST leave a fading trail showing its recent path
- **FR-007**: The trail MUST clear on episode reset
- **FR-008**: All overlays MUST not block the 3D scene — semi-transparent backgrounds
- **FR-009**: The demo MUST maintain 60fps with all visual improvements on a mid-range desktop

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor says "this looks like a racing game" within 5 seconds (camera + track quality)
- **SC-002**: The car is visible at all times — never occluded by camera angle or track geometry
- **SC-003**: The minimap accurately reflects the car's position on the full track at all times
- **SC-004**: Speed slider changes training speed within 100ms of interaction
- **SC-005**: The demo maintains 60fps with all improvements enabled

## Assumptions

- The chase camera uses lerp (linear interpolation) with a smoothing factor for natural follow behavior
- The minimap is a 2D canvas overlay, not a 3D render — lightweight
- Trail is rendered as a line geometry in 3D space, positioned slightly above the track surface
- Lane markings are decal-style meshes or textures on the track surface
- The OrbitControls from the current implementation are replaced by the chase camera (user can still drag to look around, but camera snaps back)
