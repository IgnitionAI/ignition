/**
 * Maze3DEnv — Reinforcement Learning environment in a 3D maze.
 *
 * Grid codes:
 *   0 = empty floor
 *   1 = wall
 *   2 = key (collectible)
 *   3 = locked door (requires key)
 *   4 = exit (goal)
 *   5 = trap (penalty)
 */

import type { TrainingEnv } from '@ignitionai/core'

export const MAZE_LAYOUT: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 2, 0, 0, 0, 0, 1, 0, 0, 3, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

export const CELL_SIZE = 2
export const MAX_STEPS = 500

export type MazeAction = 0 | 1 | 2 | 3 // forward, turn-left, turn-right, backward

export class Maze3DEnv implements TrainingEnv {
  actions = 4 // forward, turn-left, turn-right, backward

  private grid: number[][]
  private rows: number
  private cols: number
  private startPos: { x: number; z: number }
  private pos: { x: number; z: number }
  private angle: number // radians, 0 = facing +X
  private hasKey = false
  private stepCount = 0
  private doneFlag = false
  private lastReward = 0
  private keysCollected = 0

  constructor(grid = MAZE_LAYOUT) {
    this.grid = grid.map((r) => [...r])
    this.rows = grid.length
    this.cols = grid[0].length
    this.startPos = this.findStart()
    this.pos = { ...this.startPos }
    this.angle = 0
  }

  private findStart(): { x: number; z: number } {
    for (let z = 0; z < this.rows; z++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[z][x] === 0) return { x, z }
      }
    }
    return { x: 1, z: 1 }
  }

  observe(): number[] {
    // State: [x_norm, z_norm, angle_norm, ray_front, ray_left, ray_right, ray_fl, ray_fr, has_key, step_ratio]
    const rays = this.castRays()
    return [
      this.pos.x / (this.cols - 1),
      this.pos.z / (this.rows - 1),
      this.angle / (Math.PI * 2),
      ...rays,
      this.hasKey ? 1 : 0,
      this.stepCount / MAX_STEPS,
    ]
  }

  private castRays(): number[] {
    const directions = [0, Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4]
    return directions.map((offset) => this.rayDistance(this.angle + offset))
  }

  private rayDistance(angle: number): number {
    let dist = 0
    const step = 0.1
    const maxDist = 5
    while (dist < maxDist) {
      dist += step
      const rx = this.pos.x + Math.cos(angle) * dist
      const rz = this.pos.z + Math.sin(angle) * dist
      const gx = Math.round(rx)
      const gz = Math.round(rz)
      if (gx < 0 || gx >= this.cols || gz < 0 || gz >= this.rows) return dist
      if (this.grid[gz][gx] === 1 || this.grid[gz][gx] === 3) return dist
    }
    return maxDist
  }

  step(action: MazeAction): void {
    if (this.doneFlag) return
    this.stepCount++

    const moveSpeed = 1
    const turnSpeed = Math.PI / 2

    switch (action) {
      case 0: {
        // forward
        const nx = this.pos.x + Math.cos(this.angle) * moveSpeed
        const nz = this.pos.z + Math.sin(this.angle) * moveSpeed
        this.tryMove(nx, nz)
        break
      }
      case 1:
        this.angle += turnSpeed
        break
      case 2:
        this.angle -= turnSpeed
        break
      case 3: {
        // backward
        const nx = this.pos.x - Math.cos(this.angle) * moveSpeed
        const nz = this.pos.z - Math.sin(this.angle) * moveSpeed
        this.tryMove(nx, nz)
        break
      }
    }

    this.angle = ((this.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

    if (this.stepCount >= MAX_STEPS) {
      this.doneFlag = true
      this.lastReward = -1
      return
    }
  }

  private tryMove(nx: number, nz: number): void {
    const gx = Math.round(nx)
    const gz = Math.round(nz)
    if (gx < 0 || gx >= this.cols || gz < 0 || gz >= this.rows) {
      this.lastReward = -10 // wall bump
      return
    }
    const cell = this.grid[gz][gx]
    if (cell === 1) {
      this.lastReward = -10 // wall
      return
    }
    if (cell === 3 && !this.hasKey) {
      this.lastReward = -5 // locked door
      return
    }
    this.pos.x = nx
    this.pos.z = nz
    this.lastReward = -0.1 // step penalty

    if (cell === 2 && !this.hasKey) {
      this.hasKey = true
      this.keysCollected++
      this.grid[gz][gx] = 0
      this.lastReward = 10
    }
    if (cell === 4) {
      this.lastReward = 100
      this.doneFlag = true
    }
    if (cell === 5) {
      this.lastReward = -10
    }
  }

  reward(): number {
    return this.lastReward
  }

  done(): boolean {
    return this.doneFlag
  }

  reset(): void {
    this.pos = { ...this.startPos }
    this.angle = 0
    this.hasKey = false
    this.stepCount = 0
    this.doneFlag = false
    this.lastReward = 0
    this.keysCollected = 0
    // restore keys
    for (let z = 0; z < this.rows; z++) {
      for (let x = 0; x < this.cols; x++) {
        if (MAZE_LAYOUT[z][x] === 2 && this.grid[z][x] !== 2) {
          this.grid[z][x] = 2
        }
      }
    }
  }

  // Accessors for renderer
  getPosition(): { x: number; z: number } {
    return { ...this.pos }
  }
  getAngle(): number {
    return this.angle
  }
  getHasKey(): boolean {
    return this.hasKey
  }
  getGrid(): number[][] {
    return this.grid.map((r) => [...r])
  }
  getStepCount(): number {
    return this.stepCount
  }
}
