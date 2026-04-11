import { describe, it, expect } from 'vitest';
import { OvalTrack } from '../src/track';

describe('OvalTrack', () => {
  const track = new OvalTrack(10, 4, 2);

  it('generates a closed loop of waypoints', () => {
    expect(track.waypoints.length).toBeGreaterThan(10);
    const first = track.waypoints[0];
    const last = track.waypoints[track.waypoints.length - 1];
    const d = Math.sqrt((first.x - last.x) ** 2 + (first.y - last.y) ** 2);
    expect(d).toBeLessThan(2);
  });

  it('nearestPoint on the top straight (y=4) has small signed distance', () => {
    const result = track.nearestPoint(0, 4);
    expect(Math.abs(result.signedDistance)).toBeLessThan(1);
  });

  it('nearestPoint has opposite signs on each side of centerline', () => {
    const right = track.nearestPoint(0, 5.5);
    const left = track.nearestPoint(0, 2.5);
    // Signs should be opposite
    expect(right.signedDistance * left.signedDistance).toBeLessThan(0);
    // Both should have magnitude ~1.5
    expect(Math.abs(right.signedDistance)).toBeCloseTo(1.5, 0);
    expect(Math.abs(left.signedDistance)).toBeCloseTo(1.5, 0);
  });

  it('isOnTrack returns true for points on the track', () => {
    expect(track.isOnTrack(0, 4)).toBe(true);
    expect(track.isOnTrack(0, 5.5)).toBe(true);
    expect(track.isOnTrack(0, -4)).toBe(true);
  });

  it('isOnTrack returns false for points far from track', () => {
    expect(track.isOnTrack(0, 0)).toBe(false);
    expect(track.isOnTrack(0, 20)).toBe(false);
  });

  it('trackDirection on top straight is approximately 0', () => {
    const result = track.nearestPoint(0, 4);
    expect(Math.abs(result.trackAngle)).toBeLessThan(0.5);
  });

  it('progress returns value between 0 and 1', () => {
    const result = track.nearestPoint(0, 4);
    expect(result.progress).toBeGreaterThanOrEqual(0);
    expect(result.progress).toBeLessThanOrEqual(1);
  });

  it('totalLength is positive and reasonable', () => {
    expect(track.totalLength).toBeGreaterThan(30);
    expect(track.totalLength).toBeLessThan(60);
  });
});
