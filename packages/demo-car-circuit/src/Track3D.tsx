import { useMemo } from 'react';
import * as THREE from 'three';
import { OvalTrack } from './track';

const track = new OvalTrack(10, 4, 2);

export function Track3D() {
  const { trackShape, innerEdge, outerEdge, startPos } = useMemo(() => {
    const wps = track.waypoints;
    const hw = track.halfWidth;

    // Build inner and outer edge points
    const inner: THREE.Vector2[] = [];
    const outer: THREE.Vector2[] = [];

    for (let i = 0; i < wps.length; i++) {
      const next = wps[(i + 1) % wps.length];
      const angle = Math.atan2(next.y - wps[i].y, next.x - wps[i].x);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      inner.push(new THREE.Vector2(wps[i].x + nx * hw, wps[i].y + ny * hw));
      outer.push(new THREE.Vector2(wps[i].x - nx * hw, wps[i].y - ny * hw));
    }

    // Create track surface shape (outer path, inner hole)
    const outerShape = new THREE.Shape();
    outerShape.moveTo(outer[0].x, outer[0].y);
    for (let i = 1; i < outer.length; i++) outerShape.lineTo(outer[i].x, outer[i].y);
    outerShape.closePath();

    const holePath = new THREE.Path();
    holePath.moveTo(inner[0].x, inner[0].y);
    for (let i = 1; i < inner.length; i++) holePath.lineTo(inner[i].x, inner[i].y);
    holePath.closePath();
    outerShape.holes.push(holePath);

    // Edge lines as 3D points (map 2D y -> 3D z)
    const innerEdgePts = inner.map((p) => new THREE.Vector3(p.x, 0.04, p.y));
    innerEdgePts.push(innerEdgePts[0].clone());
    const outerEdgePts = outer.map((p) => new THREE.Vector3(p.x, 0.04, p.y));
    outerEdgePts.push(outerEdgePts[0].clone());

    return {
      trackShape: outerShape,
      innerEdge: innerEdgePts,
      outerEdge: outerEdgePts,
      startPos: wps[0],
    };
  }, []);

  const innerGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(innerEdge), [innerEdge]);
  const outerGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(outerEdge), [outerEdge]);

  return (
    <group>
      {/* Ground plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Track surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <shapeGeometry args={[trackShape]} />
        <meshStandardMaterial color="#3a3a4e" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Inner edge line */}
      <line geometry={innerGeo}>
        <lineBasicMaterial color="#6366f1" linewidth={2} />
      </line>

      {/* Outer edge line */}
      <line geometry={outerGeo}>
        <lineBasicMaterial color="#6366f1" linewidth={2} />
      </line>

      {/* Inner edge glow strip */}
      {innerEdge.slice(0, -1).map((pt, i) => {
        const next = innerEdge[(i + 1) % innerEdge.length];
        const mx = (pt.x + next.x) / 2;
        const mz = (pt.z + next.z) / 2;
        const dx = next.x - pt.x;
        const dz = next.z - pt.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh key={`ig${i}`} position={[mx, 0.025, mz]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.06, 0.02, len]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* Outer edge glow strip */}
      {outerEdge.slice(0, -1).map((pt, i) => {
        const next = outerEdge[(i + 1) % outerEdge.length];
        const mx = (pt.x + next.x) / 2;
        const mz = (pt.z + next.z) / 2;
        const dx = next.x - pt.x;
        const dz = next.z - pt.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh key={`og${i}`} position={[mx, 0.025, mz]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.06, 0.02, len]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* Start line markers */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[startPos.x, 0.12, startPos.y + side * (track.halfWidth * 0.5)]}>
          <boxGeometry args={[0.15, 0.25, 0.15]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={0.7} emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
