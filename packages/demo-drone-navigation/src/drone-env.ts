import type { TrainingEnv } from '@ignitionai/core'
import * as THREE from 'three'

/**
 * DroneEnv — a quadcopter that learns to fly to moving target points.
 *
 * NOTE on physics: full Rapier integration from a non-React context is
 * painful (the Rapier hooks from @react-three/rapier assume a <Physics>
 * component tree). To keep the env independently testable and callable
 * from the training loop, we run our OWN lightweight rigid-body integration
 * here in plain TypeScript — gravity, thrust, drag, torque, angular damping.
 * The scene uses Rapier for collision visualization and the Physics context
 * still wraps everything, but the env's state is the source of truth.
 *
 * This gives us:
 *  - Deterministic, synchronous step() compatible with @ignitionai/core
 *  - Real physics semantics (mass, inertia, gravity, drag, torque)
 *  - Fast enough to run at setSpeed(50)
 *  - A drone that actually has to learn to hover AND navigate
 */

// ---------------------------------------------------------------------------
// Tunable constants
// ---------------------------------------------------------------------------

const GRAVITY = 9.8
const MASS = 1.0              // kg
const INERTIA = 0.02          // scalar — we approximate angular inertia as isotropic
const DRAG_LINEAR = 0.15      // air drag coefficient (linear)
const DRAG_ANGULAR = 0.8      // rotational drag (prevents endless spin)
const THRUST_MAX = 20         // N total across 4 motors at full throttle
const ARM_LENGTH = 0.25       // distance from center to rotor
const DT = 0.02               // physics timestep — 50 Hz

// Env volume (cube centered at origin, +Y is up)
const VOLUME_X = 6
const VOLUME_Y = 4
const VOLUME_Z = 6
const GROUND_Y = 0
const CEILING_Y = 6           // kill if drone flies absurdly high
const MAX_STEPS = 1000

// Reward shaping
const DISTANCE_WEIGHT = 0.1
const CAPTURE_BONUS = 50
const CRASH_PENALTY = -20
const SPIN_PENALTY_WEIGHT = 0.01
const TARGET_RADIUS = 0.4     // how close to count as "captured"

// ---------------------------------------------------------------------------
// Action space — 8 discrete combos
// ---------------------------------------------------------------------------
// Each action sets the relative thrust of the four motors. The layout:
//
//        front
//      M0    M1
//   left      right
//      M2    M3
//        back
//
// A uniform thrust on all four lifts; biasing left/right produces roll,
// biasing front/back produces pitch, which translates into lateral motion.

interface ThrustMix {
  readonly label: string
  readonly m0: number
  readonly m1: number
  readonly m2: number
  readonly m3: number
}

const ACTIONS: readonly ThrustMix[] = [
  { label: 'hover_low',    m0: 0.5, m1: 0.5, m2: 0.5, m3: 0.5 },
  { label: 'hover_high',   m0: 0.9, m1: 0.9, m2: 0.9, m3: 0.9 },
  { label: 'forward',      m0: 0.6, m1: 0.6, m2: 0.9, m3: 0.9 }, // back-heavy → nose down → forward
  { label: 'backward',     m0: 0.9, m1: 0.9, m2: 0.6, m3: 0.6 },
  { label: 'left',         m0: 0.9, m1: 0.6, m2: 0.9, m3: 0.6 }, // right-heavy → roll left
  { label: 'right',        m0: 0.6, m1: 0.9, m2: 0.6, m3: 0.9 },
  { label: 'yaw_left',     m0: 0.9, m1: 0.6, m2: 0.6, m3: 0.9 }, // diagonal → yaw
  { label: 'yaw_right',    m0: 0.6, m1: 0.9, m2: 0.9, m3: 0.6 },
]

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export class DroneEnv implements TrainingEnv {
  readonly actions = ACTIONS.map((a) => a.label)

  // Position & velocity (world frame)
  position = new THREE.Vector3(0, 2, 0)
  velocity = new THREE.Vector3()

  // Orientation: euler XYZ (roll=X, pitch=Z, yaw=Y) and angular velocity
  orientation = new THREE.Euler(0, 0, 0, 'XYZ')
  angularVelocity = new THREE.Vector3()

  target = new THREE.Vector3(0, 2, 0)
  stepCount = 0
  captures = 0
  crashed = false

  // Per-step shaping fields (computed in step(), read in reward())
  private lastDistance = 0
  private progressDelta = 0
  private justCaptured = false

  // For viz: current action / thrust magnitudes (read by the scene components)
  currentAction = 0
  motorThrusts: [number, number, number, number] = [0.5, 0.5, 0.5, 0.5]

  constructor() {
    this.reset()
  }

  // ------------------------------------------------------------------------
  // TrainingEnv
  // ------------------------------------------------------------------------

  observe(): number[] {
    const delta = this.target.clone().sub(this.position)
    const dist = delta.length()
    // Normalized dx, dy, dz (clamp to [-1, 1])
    const dx = THREE.MathUtils.clamp(delta.x / (VOLUME_X / 2), -1, 1)
    const dy = THREE.MathUtils.clamp(delta.y / VOLUME_Y, -1, 1)
    const dz = THREE.MathUtils.clamp(delta.z / (VOLUME_Z / 2), -1, 1)

    // Normalized absolute position (so the policy learns bounds of the arena)
    const px = THREE.MathUtils.clamp(this.position.x / (VOLUME_X / 2), -1, 1)
    const py = THREE.MathUtils.clamp((this.position.y - GROUND_Y) / VOLUME_Y, -1, 1)
    const pz = THREE.MathUtils.clamp(this.position.z / (VOLUME_Z / 2), -1, 1)

    // Velocity (normalized against a nominal 5 m/s)
    const vx = THREE.MathUtils.clamp(this.velocity.x / 5, -1, 1)
    const vy = THREE.MathUtils.clamp(this.velocity.y / 5, -1, 1)
    const vz = THREE.MathUtils.clamp(this.velocity.z / 5, -1, 1)

    // Orientation (already in radians; divide by π to normalize)
    const roll = this.orientation.x / Math.PI
    const pitch = this.orientation.z / Math.PI
    // yaw omitted — navigation is yaw-invariant, the policy doesn't need it

    // Angular velocity (normalized)
    const wx = THREE.MathUtils.clamp(this.angularVelocity.x / 5, -1, 1)
    const wz = THREE.MathUtils.clamp(this.angularVelocity.z / 5, -1, 1)

    // Distance as a scalar cue
    const distNorm = Math.min(dist / Math.max(VOLUME_X, VOLUME_Z), 1)

    void px; void py; void pz; void vz; void wx

    return [dx, dy, dz, vx, vy, roll, pitch, wz, distNorm, px, py, pz, dist / 10]
  }

  step(action: number | number[]): void {
    const a = typeof action === 'number' ? action : action[0]
    const mix = ACTIONS[Math.max(0, Math.min(ACTIONS.length - 1, a))]
    this.currentAction = a
    this.motorThrusts = [mix.m0, mix.m1, mix.m2, mix.m3]

    // --- Physics integration (semi-implicit Euler) ------------------------

    // Total thrust magnitude (sum of 4 motors × THRUST_MAX/4)
    const thrustPer = THRUST_MAX / 4
    const m0 = mix.m0 * thrustPer
    const m1 = mix.m1 * thrustPer
    const m2 = mix.m2 * thrustPer
    const m3 = mix.m3 * thrustPer

    // Total lift in BODY frame (+Y body axis)
    const lift = m0 + m1 + m2 + m3

    // Torques (body frame):
    //   roll (x-axis):  (m0 + m2) - (m1 + m3)  → positive = roll right
    //   pitch (z-axis): (m0 + m1) - (m2 + m3)  → positive = nose up
    //   yaw (y-axis):   (m0 + m3) - (m1 + m2)  (differential drag approximation)
    const torqueRoll = ((m0 + m2) - (m1 + m3)) * ARM_LENGTH
    const torquePitch = ((m0 + m1) - (m2 + m3)) * ARM_LENGTH
    const torqueYaw = ((m0 + m3) - (m1 + m2)) * ARM_LENGTH * 0.3

    // Convert body-frame lift into world frame using current orientation
    const liftVec = new THREE.Vector3(0, lift, 0)
    liftVec.applyEuler(this.orientation)

    // Linear acceleration
    const accel = liftVec.clone().divideScalar(MASS)
    accel.y -= GRAVITY
    // Linear drag
    accel.sub(this.velocity.clone().multiplyScalar(DRAG_LINEAR / MASS))

    this.velocity.add(accel.clone().multiplyScalar(DT))
    this.position.add(this.velocity.clone().multiplyScalar(DT))

    // Angular acceleration
    const angAccel = new THREE.Vector3(
      torqueRoll / INERTIA,
      torqueYaw / INERTIA,
      torquePitch / INERTIA,
    )
    // Angular drag
    angAccel.sub(this.angularVelocity.clone().multiplyScalar(DRAG_ANGULAR))

    this.angularVelocity.add(angAccel.clone().multiplyScalar(DT))
    this.orientation.x += this.angularVelocity.x * DT
    this.orientation.y += this.angularVelocity.y * DT
    this.orientation.z += this.angularVelocity.z * DT

    // --- Termination / progress ------------------------------------------

    // Crash check: ground impact or absurd altitude
    if (this.position.y <= GROUND_Y + 0.1) {
      this.crashed = true
      this.position.y = GROUND_Y + 0.1
      this.velocity.set(0, 0, 0)
    }
    if (this.position.y > CEILING_Y) {
      this.crashed = true
    }
    // Out-of-volume crash
    if (
      Math.abs(this.position.x) > VOLUME_X ||
      Math.abs(this.position.z) > VOLUME_Z
    ) {
      this.crashed = true
    }

    // Distance progress
    const dist = this.position.distanceTo(this.target)
    this.progressDelta = this.lastDistance - dist   // positive = got closer
    this.lastDistance = dist

    // Capture check
    this.justCaptured = false
    if (dist < TARGET_RADIUS) {
      this.captures++
      this.justCaptured = true
      this.spawnTarget()
      this.lastDistance = this.position.distanceTo(this.target)
    }

    this.stepCount++
  }

  reward(): number {
    if (this.crashed) return CRASH_PENALTY

    const dist = this.lastDistance
    const distancePenalty = -dist * DISTANCE_WEIGHT

    // Small progress bonus: when the drone gets closer, it earns extra.
    // This is the single biggest lever for getting the policy to explore
    // toward the target instead of finding a cozy hover spot.
    const progressBonus = this.progressDelta * 2

    const spinPenalty = -SPIN_PENALTY_WEIGHT * this.angularVelocity.length()

    const base = distancePenalty + progressBonus + spinPenalty
    return this.justCaptured ? base + CAPTURE_BONUS : base
  }

  done(): boolean {
    if (this.crashed) return true
    if (this.stepCount >= MAX_STEPS) return true
    return false
  }

  reset(): void {
    this.position.set(0, 2, 0)
    this.velocity.set(0, 0, 0)
    this.orientation.set(0, 0, 0)
    this.angularVelocity.set(0, 0, 0)
    this.stepCount = 0
    this.captures = 0
    this.crashed = false
    this.justCaptured = false
    this.progressDelta = 0
    this.currentAction = 0
    this.motorThrusts = [0.5, 0.5, 0.5, 0.5]
    this.spawnTarget()
    this.lastDistance = this.position.distanceTo(this.target)
  }

  // ------------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------------

  private spawnTarget(): void {
    // Pick a point in the flight volume, avoiding the floor and ceiling
    this.target.set(
      (Math.random() - 0.5) * VOLUME_X * 0.8,
      1 + Math.random() * (VOLUME_Y - 1.5),
      (Math.random() - 0.5) * VOLUME_Z * 0.8,
    )
  }
}
