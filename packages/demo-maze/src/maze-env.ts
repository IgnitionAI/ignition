import type { TrainingEnv } from '@ignitionai/core';
import {
  AGENT_RADIUS,
  ARENA_DEPTH,
  ARENA_WIDTH,
  CHECKPOINTS,
  DOOR_PAD,
  GOAL,
  SENSOR_RANGE,
  START,
  circleIntersectsRect,
  clamp,
  clamp01,
  distance,
  movingHazards,
  solidRects,
} from './maze-layout';

const TURN = Math.PI / 7;
const MOVE = 0.34;
const STRAFE = 0.27;
const MAX_STEPS = 260;
const SENSOR_ANGLES = [-90, -50, -18, 18, 50, 90].map((deg) => (deg * Math.PI) / 180);

export class MazeEnv implements TrainingEnv {
  actions = ['forward', 'turnLeft', 'turnRight', 'strafeLeft', 'strafeRight', 'wait'];
  agentX = START.x;
  agentZ = START.z;
  heading = START.heading;
  stepCount = 0;
  lastActionBlocked = false;
  lastHazardHit = false;
  lastReward = 0;
  doorOpen = false;
  sensors = new Array(SENSOR_ANGLES.length).fill(1);
  trail: [number, number][] = [];
  visitedCheckpoints = new Set<string>();
  lastAction = 'reset';

  private previousGoalDistance = distance(START.x, START.z, GOAL.x, GOAL.z);
  private lastProgress = 0;

  observe(): number[] {
    const goalDx = (GOAL.x - this.agentX) / ARENA_WIDTH;
    const goalDz = (GOAL.z - this.agentZ) / ARENA_DEPTH;
    this.sensors = this.castSensors();

    return [
      clamp01((this.agentX + ARENA_WIDTH / 2) / ARENA_WIDTH),
      clamp01((this.agentZ + ARENA_DEPTH / 2) / ARENA_DEPTH),
      (Math.sin(this.heading) + 1) / 2,
      (Math.cos(this.heading) + 1) / 2,
      clamp01(goalDx + 0.5),
      clamp01(goalDz + 0.5),
      clamp01(distance(this.agentX, this.agentZ, GOAL.x, GOAL.z) / Math.hypot(ARENA_WIDTH, ARENA_DEPTH)),
      ...this.sensors,
      clamp01(this.nearestHazardDistance() / 3.2),
      this.doorOpen ? 1 : 0,
      clamp01(this.lastProgress * 2 + 0.5),
    ];
  }

  step(action: number | number[]): void {
    const a = typeof action === 'number' ? action : action[0];
    this.stepCount += 1;
    this.lastActionBlocked = false;
    this.lastHazardHit = false;
    this.lastProgress = 0;

    if (a === 1) this.heading -= TURN;
    if (a === 2) this.heading += TURN;

    const forwardX = Math.cos(this.heading);
    const forwardZ = Math.sin(this.heading);
    const rightX = Math.cos(this.heading + Math.PI / 2);
    const rightZ = Math.sin(this.heading + Math.PI / 2);
    let dx = 0;
    let dz = 0;

    if (a === 0) {
      dx = forwardX * MOVE;
      dz = forwardZ * MOVE;
      this.lastAction = 'forward';
    } else if (a === 3) {
      dx = -rightX * STRAFE;
      dz = -rightZ * STRAFE;
      this.lastAction = 'strafeLeft';
    } else if (a === 4) {
      dx = rightX * STRAFE;
      dz = rightZ * STRAFE;
      this.lastAction = 'strafeRight';
    } else if (a === 5) {
      this.lastAction = 'wait';
    } else {
      this.lastAction = a === 1 ? 'turnLeft' : 'turnRight';
    }

    this.doorOpen = this.doorOpen || distance(this.agentX, this.agentZ, DOOR_PAD.x, DOOR_PAD.z) < DOOR_PAD.radius;
    this.moveAgent(dx, dz);
    this.lastHazardHit = this.nearestHazardDistance() < AGENT_RADIUS + 0.3;

    const goalDistance = distance(this.agentX, this.agentZ, GOAL.x, GOAL.z);
    this.lastProgress = this.previousGoalDistance - goalDistance;
    this.previousGoalDistance = goalDistance;
    this.lastReward = this.computeReward();

    this.trail.push([this.agentX, this.agentZ]);
    if (this.trail.length > 140) this.trail.shift();
    this.markCheckpoints();
    this.sensors = this.castSensors();
  }

  reward(): number {
    return this.lastReward;
  }

  done(): boolean {
    return this.reachedGoal() || this.stepCount >= MAX_STEPS;
  }

  reset(): void {
    this.agentX = START.x;
    this.agentZ = START.z;
    this.heading = START.heading;
    this.stepCount = 0;
    this.lastActionBlocked = false;
    this.lastHazardHit = false;
    this.lastReward = 0;
    this.lastProgress = 0;
    this.doorOpen = false;
    this.trail = [];
    this.visitedCheckpoints.clear();
    this.previousGoalDistance = distance(START.x, START.z, GOAL.x, GOAL.z);
    this.sensors = this.castSensors();
    this.lastAction = 'reset';
  }

  snapshot() {
    return {
      agentX: this.agentX,
      agentZ: this.agentZ,
      heading: this.heading,
      goalX: GOAL.x,
      goalZ: GOAL.z,
      doorOpen: this.doorOpen,
      hazards: movingHazards(this.stepCount).map(({ id, x, z, radius }) => ({ id, x, z, radius })),
      sensors: [...this.sensors],
      trail: [...this.trail],
      lastActionBlocked: this.lastActionBlocked,
      lastHazardHit: this.lastHazardHit,
      lastAction: this.lastAction,
    };
  }

  private moveAgent(dx: number, dz: number): void {
    if (dx === 0 && dz === 0) return;

    const nextX = clamp(this.agentX + dx, -ARENA_WIDTH / 2 + AGENT_RADIUS, ARENA_WIDTH / 2 - AGENT_RADIUS);
    const nextZ = clamp(this.agentZ + dz, -ARENA_DEPTH / 2 + AGENT_RADIUS, ARENA_DEPTH / 2 - AGENT_RADIUS);
    const blocked = solidRects(this.doorOpen).some((rect) => circleIntersectsRect(nextX, nextZ, AGENT_RADIUS, rect));

    if (blocked) {
      this.lastActionBlocked = true;
      return;
    }

    this.agentX = nextX;
    this.agentZ = nextZ;
  }

  private computeReward(): number {
    if (this.reachedGoal()) return 1.4;
    let reward = -0.012 + this.lastProgress * 0.15;
    if (this.lastActionBlocked) reward -= 0.09;
    if (this.lastHazardHit) reward -= 0.18;
    if (this.lastAction === 'wait') reward -= 0.025;
    return Number(reward.toFixed(4));
  }

  private markCheckpoints(): void {
    for (const checkpoint of CHECKPOINTS) {
      if (this.visitedCheckpoints.has(checkpoint.id)) continue;
      if (distance(this.agentX, this.agentZ, checkpoint.x, checkpoint.z) < checkpoint.radius) {
        this.visitedCheckpoints.add(checkpoint.id);
        this.lastReward += 0.08;
      }
    }
  }

  private reachedGoal(): boolean {
    return distance(this.agentX, this.agentZ, GOAL.x, GOAL.z) < GOAL.radius;
  }

  private nearestHazardDistance(): number {
    return Math.min(
      ...movingHazards(this.stepCount).map((hazard) => (
        Math.max(0, distance(this.agentX, this.agentZ, hazard.x, hazard.z) - hazard.radius)
      )),
    );
  }

  private castSensors(): number[] {
    return SENSOR_ANGLES.map((offset) => {
      const angle = this.heading + offset;
      const step = 0.13;
      for (let dist = step; dist <= SENSOR_RANGE; dist += step) {
        const x = this.agentX + Math.cos(angle) * dist;
        const z = this.agentZ + Math.sin(angle) * dist;
        const hitWall = solidRects(this.doorOpen).some((rect) => circleIntersectsRect(x, z, 0.04, rect));
        const hitHazard = movingHazards(this.stepCount).some((hazard) => distance(x, z, hazard.x, hazard.z) < hazard.radius);
        if (hitWall || hitHazard) return clamp01(dist / SENSOR_RANGE);
      }
      return 1;
    });
  }
}
