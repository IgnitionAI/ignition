export interface TrackPoint {
  x: number;
  y: number;
}

export interface NearestResult {
  /** Signed distance from centerline (positive = right, negative = left) */
  signedDistance: number;
  /** Track direction angle (radians) at the nearest point */
  trackAngle: number;
  /** Fraction of the track completed [0, 1] */
  progress: number;
  /** Index of nearest waypoint */
  waypointIndex: number;
}

/**
 * Oval track defined by two straight segments connected by two semicircles.
 *
 * Layout (top-down view):
 *   ┌──────────────────┐
 *   │   top straight    │
 *  (  left curve        ) right curve
 *   │  bottom straight  │
 *   └──────────────────┘
 */
export class OvalTrack {
  readonly waypoints: TrackPoint[] = [];
  readonly halfWidth: number;
  readonly totalLength: number;

  constructor(
    public readonly straightLength: number = 10,
    public readonly curveRadius: number = 4,
    halfWidth: number = 2,
    private readonly resolution: number = 64,
  ) {
    this.halfWidth = halfWidth;
    this.waypoints = this.generateWaypoints();
    this.totalLength = this.computeLength();
  }

  private generateWaypoints(): TrackPoint[] {
    const pts: TrackPoint[] = [];
    const sl = this.straightLength / 2;
    const r = this.curveRadius;
    const n = this.resolution;
    const stepsPerSection = Math.floor(n / 4);

    // Top straight: left to right
    for (let i = 0; i <= stepsPerSection; i++) {
      const t = i / stepsPerSection;
      pts.push({ x: -sl + t * this.straightLength, y: r });
    }

    // Right semicircle: top to bottom
    for (let i = 1; i <= stepsPerSection; i++) {
      const angle = Math.PI / 2 - (i / stepsPerSection) * Math.PI;
      pts.push({ x: sl + r * Math.cos(angle), y: r * Math.sin(angle) });
    }

    // Bottom straight: right to left
    for (let i = 1; i <= stepsPerSection; i++) {
      const t = i / stepsPerSection;
      pts.push({ x: sl - t * this.straightLength, y: -r });
    }

    // Left semicircle: bottom to top
    for (let i = 1; i <= stepsPerSection; i++) {
      const angle = -Math.PI / 2 - (i / stepsPerSection) * Math.PI;
      pts.push({ x: -sl + r * Math.cos(angle), y: r * Math.sin(angle) });
    }

    return pts;
  }

  private computeLength(): number {
    let len = 0;
    for (let i = 1; i < this.waypoints.length; i++) {
      const dx = this.waypoints[i].x - this.waypoints[i - 1].x;
      const dy = this.waypoints[i].y - this.waypoints[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    // Close the loop
    const first = this.waypoints[0];
    const last = this.waypoints[this.waypoints.length - 1];
    len += Math.sqrt((first.x - last.x) ** 2 + (first.y - last.y) ** 2);
    return len;
  }

  nearestPoint(x: number, y: number): NearestResult {
    let bestDist = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < this.waypoints.length; i++) {
      const dx = x - this.waypoints[i].x;
      const dy = y - this.waypoints[i].y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    const wp = this.waypoints[bestIdx];
    const nextIdx = (bestIdx + 1) % this.waypoints.length;
    const next = this.waypoints[nextIdx];

    // Track direction at this point
    const trackAngle = Math.atan2(next.y - wp.y, next.x - wp.x);

    // Signed distance: cross product gives sign (positive = right of track direction)
    const dx = x - wp.x;
    const dy = y - wp.y;
    const trackDirX = Math.cos(trackAngle);
    const trackDirY = Math.sin(trackAngle);
    const signedDistance = dx * trackDirY - dy * trackDirX;

    // Progress along the track
    const progress = bestIdx / this.waypoints.length;

    return { signedDistance, trackAngle, progress, waypointIndex: bestIdx };
  }

  isOnTrack(x: number, y: number): boolean {
    const { signedDistance } = this.nearestPoint(x, y);
    return Math.abs(signedDistance) <= this.halfWidth;
  }
}
